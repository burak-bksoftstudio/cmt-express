import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSimpleToast } from "@/components/ui/toast";
import { discussionApi, DiscussionData, DiscussionMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  MessageSquare,
  Send,
  Loader2,
  Lock,
  Unlock,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DiscussionPanelProps {
  paperId: string;
  conferenceId: string;
  isChair?: boolean;
}

export function DiscussionPanel({ paperId, conferenceId, isChair = false }: DiscussionPanelProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const { user } = useAuthStore();

  const [discussion, setDiscussion] = useState<DiscussionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await discussionApi.getByPaper(paperId);
        const data = response.data?.data;
        if (data) {
          setDiscussion(data);
        }
      } catch (error: any) {
        console.error("Failed to fetch discussion:", error);
        if (error.response?.status !== 403 && error.response?.status !== 404) {
          addToast({
            type: "error",
            title: "Load Failed",
            description: "Failed to load discussion",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [paperId, addToast]);

  useEffect(() => {
    scrollToBottom();
  }, [discussion?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !discussion) return;

    setSending(true);
    try {
      await discussionApi.addMessage(discussion.id, newMessage.trim());
      setNewMessage("");

      // Refresh discussion
      const response = await discussionApi.getByPaper(paperId);
      const data = response.data?.data;
      if (data) {
        setDiscussion(data);
      }

      addToast({
        type: "success",
        title: "Message Sent",
        description: "Your message has been posted",
      });
    } catch (error: any) {
      console.error("Failed to send message:", error);
      addToast({
        type: "error",
        title: "Send Failed",
        description: error.response?.data?.message || "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!discussion) return;

    setToggling(true);
    try {
      if (discussion.status === "open") {
        await discussionApi.close(discussion.id);
      } else {
        await discussionApi.reopen(discussion.id);
      }

      // Refresh discussion
      const response = await discussionApi.getByPaper(paperId);
      const data = response.data?.data;
      if (data) {
        setDiscussion(data);
      }

      addToast({
        type: "success",
        title: discussion.status === "open" ? "Discussion Closed" : "Discussion Reopened",
        description: `Discussion has been ${discussion.status === "open" ? "closed" : "reopened"}`,
      });
    } catch (error: any) {
      console.error("Failed to toggle discussion:", error);
      addToast({
        type: "error",
        title: "Action Failed",
        description: error.response?.data?.message || "Failed to update discussion status",
      });
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await discussionApi.deleteMessage(messageId);

      // Refresh discussion
      const response = await discussionApi.getByPaper(paperId);
      const data = response.data?.data;
      if (data) {
        setDiscussion(data);
      }

      addToast({
        type: "success",
        title: "Message Deleted",
        description: "Message has been removed",
      });
    } catch (error: any) {
      console.error("Failed to delete message:", error);
      addToast({
        type: "error",
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete message",
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const isOwnMessage = (message: DiscussionMessage) => {
    return message.userId === user?.id;
  };

  const canDeleteMessage = (message: DiscussionMessage) => {
    return isChair || isOwnMessage(message);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            PC Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!discussion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            PC Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Discussion not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isClosed = discussion.status === "closed";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              PC Discussion
              <Badge variant={isClosed ? "secondary" : "default"} className="ml-2">
                {isClosed ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Closed
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Open
                  </>
                )}
              </Badge>
            </CardTitle>
            {isChair && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={toggling}
                className="gap-2"
              >
                {toggling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isClosed ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isClosed ? "Reopen" : "Close"}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Internal discussion for Program Committee members
          </p>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
            {discussion.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Start the discussion by posting a message</p>
              </div>
            ) : (
              <AnimatePresence>
                {discussion.messages.map((message, index) => {
                  const isOwn = isOwnMessage(message);
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className={isOwn ? "bg-primary text-primary-foreground" : ""}>
                          {getInitials(message.user?.firstName, message.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex-1 ${isOwn ? "text-right" : "text-left"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!isOwn && (
                            <span className="text-sm font-medium">
                              {message.user
                                ? `${message.user.firstName} ${message.user.lastName}`
                                : "Unknown"}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                          {canDeleteMessage(message) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingMessageId(message.id)}
                              className="h-6 w-6 p-0 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div
                          className={`inline-block rounded-lg px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {!isClosed && (
            <div className="space-y-2 pt-4 border-t">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={3}
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <p className="text-sm">This discussion has been closed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMessageId} onOpenChange={() => setDeletingMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMessageId && handleDeleteMessage(deletingMessageId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastRenderer />
    </>
  );
}
