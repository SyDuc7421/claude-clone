"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { AppSidebar, ChatItem } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ArrowUp,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Plus,
  FileText,
  Image as ImageIcon,
  X,
  Settings,
  User,
  LogOut,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  useConversations,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation
} from "@/hooks/useConversations";
import { useMessages, useCreateMessageMutation } from "@/hooks/useMessages";
import { Message } from "@/lib/types/api";

export type UIMessage = Omit<Message, "id"> & {
  id: number | string;
  files?: { name: string; type: string }[];
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoading: authLoading } = useAuth();

  const { data: serverConversations, isLoading: isConversationsLoading } = useConversations();
  const createConversation = useCreateConversationMutation();
  const updateConversation = useUpdateConversationMutation();
  const deleteConversation = useDeleteConversationMutation();

  const [_activeChatId, setActiveChatId] = useState<string>("");
  // Derive activeChatId during render — avoids setState in effect
  const activeChatId = _activeChatId ||
    (!isConversationsLoading && serverConversations?.length
      ? serverConversations[0].id.toString()
      : "");

  const { data: serverMessages, isLoading: isMessagesLoading } = useMessages(
    activeChatId ? activeChatId : ""
  );
  const createMessage = useCreateMessageMutation();


  const chats: ChatItem[] = useMemo(() => (serverConversations || []).map((c) => ({
    id: c.id.toString(),
    title: c.title || "New Chat",
    updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : new Date().getTime(),
  })), [serverConversations]);

  // null = use serverMessages as source of truth; array = local/optimistic messages
  const [localMessages, setLocalMessages] = useState<UIMessage[] | null>(null);
  const currentMessages: UIMessage[] = localMessages ?? ((serverMessages as UIMessage[]) || []);

  const handleNewChat = async () => {
    const newConv = await createConversation.mutateAsync({ title: "New Chat" });
    setActiveChatId(newConv.id.toString());
    setInput("");
    setFiles([]);
    setLocalMessages([]);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setInput("");
    setFiles([]);
    setLocalMessages(null);
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    updateConversation.mutate({ id, data: { title: newTitle } });
  };

  const handleDeleteChat = (id: string) => {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (activeChatId === id) {
          const index = chats.findIndex(c => c.id === id);
          if (chats.length > 1) {
            const nextChat = chats[index === 0 ? 1 : index - 1];
            setActiveChatId(nextChat.id);
          } else {
            setActiveChatId("");
          }
          setLocalMessages(null);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && files.length === 0) || createMessage.isPending) return;

    const targetConversationId = activeChatId;

    const messageContent = input.trim();


    setLocalMessages((prev) => [
      ...(prev ?? (serverMessages as UIMessage[]) ?? []),
      { content: messageContent, role: "user", id: Date.now(), conversation_id: parseInt(targetConversationId as string) },
    ]);
    setInput("");
    setFiles([]);

    createMessage.mutate({
      content: messageContent,
      conversation_id: parseInt(targetConversationId as string),
      role: "user"
    }, {
      onSettled: (data, error) => {
        if (data && data.user_message && data.assistant_message) {
          setLocalMessages((prev) => {
            const copy = [...(prev ?? [])];
            copy.pop(); // remove optimistic message
            return [...copy, data.user_message, data.assistant_message];
          });
        }
        if (error) {
          console.error("Failed to create message", error);
        }
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages.length, createMessage.isPending]);

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-zinc-50">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats}
        activeChatId={activeChatId || ""}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex flex-col flex-1 h-screen bg-white transition-all w-full min-w-0 font-sans">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-zinc-500 hover:text-zinc-800" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 text-[15px] font-medium text-zinc-700 hover:bg-zinc-100 flex items-center h-9 px-3 rounded-xl"
                >
                  Claude 3.5 Sonnet
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px] rounded-xl">
                <DropdownMenuItem className="py-2.5">
                  <div className="flex flex-col">
                    <span className="font-medium text-[14px]">Claude 3.5 Sonnet</span>
                    <span className="text-xs text-zinc-500">Fastest and most intelligent</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2.5">
                  <div className="flex flex-col">
                    <span className="font-medium text-[14px]">Claude 3 Opus</span>
                    <span className="text-xs text-zinc-500">Powerful for complex tasks</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="" />
                <AvatarFallback className="bg-orange-100 text-orange-800 text-sm font-medium">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 w-full flex flex-col items-center pb-8" ref={scrollRef}>
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col gap-8">
            {isMessagesLoading && activeChatId && currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d97757]"></div>
              </div>
            ) : null}

            {currentMessages.length === 0 && !isMessagesLoading && !activeChatId && (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center max-w-lg mx-auto space-y-4">
                <Avatar className="h-16 w-16 bg-[#d97757] text-[#f4efe6]">
                  <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-medium tracking-tight text-zinc-800">
                  Good evening
                </h2>
              </div>
            )}

            {currentMessages.map((m, idx) => (

              <div
                key={`${m.id}-${idx}`}
                className={cn(
                  "flex w-full",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div className={cn("flex max-w-[85%] gap-4 rounded-xl",
                  m.role !== "user" ? "" : "bg-[#f4f4f4] px-5 py-4"
                )}>
                  {m.role !== "user" && (
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-[#d97757] text-[#f4efe6]">
                      <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    {m.role !== "user" && (
                      <span className="text-[14px] font-semibold text-zinc-800">Chat Bot</span>
                    )}
                    {m.content && (
                      <div className={cn(
                        "prose prose-sm break-words max-w-none text-[15px] leading-relaxed whitespace-pre-wrap",
                        m.role !== "user" ? "text-zinc-800" : "text-zinc-800"
                      )}>
                        {m.content}
                      </div>
                    )}

                    {/* Assistant Message Actions */}
                    {m.role !== "user" && (
                      <div className="flex items-center gap-1 mt-2 -ml-2 text-zinc-400">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-zinc-700">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-zinc-700">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-zinc-700">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-zinc-700">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {createMessage.isPending && (
              <div className="flex w-full justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-[#d97757] text-[#f4efe6]">
                    <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-semibold text-zinc-800">Chat Bot</span>
                    <div className="flex items-center gap-1 h-6">
                      <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-6 bg-white shrink-0">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col w-full border border-zinc-200 shadow-sm bg-zinc-50/50 rounded-2xl focus-within:ring-1 focus-within:ring-zinc-300 focus-within:border-zinc-300 transition-all"
          >
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-4 pb-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-xl pl-3 pr-2 py-2 group relative">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-zinc-500" />
                    )}
                    <span className="text-[13px] font-medium text-zinc-700 max-w-[100px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="h-5 w-5 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can Chat Bot help you today?"
              className="resize-none min-h-[50px] max-h-[250px] bg-transparent border-0 focus-visible:ring-0 py-3.5 px-4 text-[15px] placeholder:text-zinc-400 scrollbar-thin"
              rows={1}
              style={{ height: 'auto', minHeight: '60px' }}
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 rounded-xl hover:text-zinc-800 hover:bg-zinc-200/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-[18px] w-[18px]" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 rounded-xl hover:text-zinc-800 hover:bg-zinc-200/50">
                  <Globe className="h-[18px] w-[18px]" />
                </Button>
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={(!input.trim() && files.length === 0) || createMessage.isPending}
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  input.trim() || files.length > 0
                    ? "bg-[#d97757] text-white hover:bg-[#c4694a]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                )}
              >
                <ArrowUp className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </form>
          <div className="text-center mt-3 text-xs text-zinc-500 font-medium">
            Chat Box can make mistakes. Please double-check responses.
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your appearance and chat preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium">Language</span>
              </div>
              <span className="text-sm text-zinc-500">English</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
