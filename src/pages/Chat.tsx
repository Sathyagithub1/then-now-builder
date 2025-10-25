import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && conversations.length > 0) {
      const user = conversations.find((c) => c.id === userId);
      if (user) {
        selectConversation(user);
      }
    }
  }, [searchParams, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setCurrentUser(profile);

    // Fetch all users the current user has chatted with
    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    const userIds = new Set<string>();
    messagesData?.forEach((msg) => {
      if (msg.sender_id !== session.user.id) userIds.add(msg.sender_id);
      if (msg.receiver_id !== session.user.id) userIds.add(msg.receiver_id);
    });

    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      setConversations(users || []);
    }

    setLoading(false);
  };

  const selectConversation = async (user: any) => {
    setSelectedUser(user);
    await loadMessages(user.id);
    setupRealtime(user.id);
  };

  const loadMessages = async (userId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:sender_id(full_name, avatar_url),
        receiver:receiver_id(full_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark messages as read
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("receiver_id", currentUser.id)
      .eq("sender_id", userId);
  };

  const setupRealtime = (userId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`chat:${currentUser.id}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `sender_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message: newMessage,
      order_id: searchParams.get("order") || null,
    });

    if (error) {
      toast.error("Error sending message");
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          message: newMessage,
          created_at: new Date().toISOString(),
          sender: currentUser,
        },
      ]);
      setNewMessage("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectConversation(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent ${
                        selectedUser?.id === user.id ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.role === "farmer" ? "Farmer" : "Farm Worker"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar_url} />
                    <AvatarFallback>{selectedUser.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.mobile_number}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4 h-[calc(100vh-400px)]">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.sender_id === currentUser.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_id === currentUser.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;
