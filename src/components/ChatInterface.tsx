
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ChatInterfaceProps {
  requestId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

const ChatInterface = ({ requestId, otherUserId, otherUserName, otherUserAvatar }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when component mounts
  useEffect(() => {
    if (!user || !requestId) return;
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `show_request_id=eq.${requestId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Only add to state if not already there
          setMessages(currentMessages => {
            if (!currentMessages.some(msg => msg.id === newMessage.id)) {
              return [...currentMessages, newMessage];
            }
            return currentMessages;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, requestId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!user || !requestId) return;
    
    try {
      setLoading(true);
      
      // Fixing the query to properly specify the relationship with sender_id
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('show_request_id', requestId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // First convert to unknown to bypass TypeScript's type checking, then to ChatMessage[]
      setMessages((data as unknown) as ChatMessage[]);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data
          .filter(msg => msg.receiver_id === user.id && !msg.read)
          .map(msg => msg.id);
          
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error loading messages",
        description: error.message || "Could not load chat messages."
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || !requestId) return;
    
    try {
      setSending(true);
      
      // Insert new message
      const { error } = await supabase
        .from('messages')
        .insert({
          show_request_id: requestId,
          sender_id: user.id,
          receiver_id: otherUserId,
          content: message.trim()
        });
        
      if (error) throw error;
      
      // Clear input field
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.message || "Could not send your message."
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
          </Avatar>
          Chat with {otherUserName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.sender_id === user?.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!isCurrentUser && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.sender?.avatar_url} />
                          <AvatarFallback>{getInitials(msg.sender?.full_name || otherUserName)}</AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-xs opacity-70">
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full items-end gap-2">
          <Textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={sending || !message.trim()} 
            size="icon"
            className="h-10 w-10"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatInterface;
