"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  Paperclip,
  ArrowUp,
  Globe,
  MoreHorizontal,
  PenLine,
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

// Types
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string }[];
};

// Simulated API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockApi = {
  sendMessage: async (message: string): Promise<Message> => {
    await delay(1500);
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: `Here is a simulated response to: "${message}". Using Shadcn UI with Tailwind CSS and Tanstack React Query creates a modern, sleek workflow.`,
    };
  },
};

export default function ChatPage() {
  const [chats, setChats] = useState<ChatItem[]>(() => [
    { id: "init-chat", title: "New Chat", updatedAt: Date.now() },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>("init-chat");
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({
    "init-chat": [
      {
        id: "init",
        role: "assistant",
        content:
          "Hello! I am ready to help. I am built with Next.js, Shadcn UI, and TanStack Query. I now support multiple conversations too!",
      },
    ],
  });

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoading: authLoading } = useAuth();

  const currentMessages = chatHistories[activeChatId] || [];

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    setChats([{ id: newChatId, title: "New Chat", updatedAt: Date.now() }, ...chats]);
    setChatHistories({
      ...chatHistories,
      [newChatId]: [
        {
          id: "init",
          role: "assistant",
          content: "Hello! I am ready to help.",
        },
      ],
    });
    setActiveChatId(newChatId);
    setInput("");
    setFiles([]);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setInput("");
    setFiles([]);
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(chats.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleDeleteChat = (id: string) => {
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);

    // Cleanup history
    const newHistories = { ...chatHistories };
    delete newHistories[id];
    setChatHistories(newHistories);

    // If active chat deleted, switch to another or create new
    if (activeChatId === id) {
      if (newChats.length > 0) {
        setActiveChatId(newChats[0].id);
      } else {
        const newChatId = Date.now().toString();
        setChats([{ id: newChatId, title: "New Chat", updatedAt: Date.now() }]);
        setChatHistories({
          [newChatId]: [{ id: "init", role: "assistant", content: "Hello! I am ready to help." }],
        });
        setActiveChatId(newChatId);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation<Message, Error, string, { chatId?: string }>({
    mutationFn: (message: string) => mockApi.sendMessage(message),
    onMutate: async (message) => {
      return { chatId: activeChatId };
    },
    onSuccess: (data, variables, context) => {
      const targetChatId = context?.chatId || activeChatId;
      setChatHistories(prev => ({
        ...prev,
        [targetChatId]: [...(prev[targetChatId] || []), data]
      }));
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && files.length === 0) || mutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      files: files.map((f) => ({ name: f.name, type: f.type })),
    };

    const currentChatId = activeChatId;

    // Update message history
    setChatHistories(prev => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), userMessage]
    }));

    // Extract title from first user message if it's currently "New Chat"
    const chat = chats.find(c => c.id === currentChatId);
    if (chat && chat.title === "New Chat" && currentMessages.length === 1) {
      const generatedTitle = input.trim().slice(0, 30) + (input.length > 30 ? "..." : "");
      if (generatedTitle) {
        setChats(prev => prev.map(c =>
          c.id === currentChatId ? { ...c, title: generatedTitle, updatedAt: Date.now() } : c
        ));
      }
    } else {
      // Just update timestamp
      setChats(prev => prev.map(c =>
        c.id === currentChatId ? { ...c, updatedAt: Date.now() } : c
      ));
    }

    const prompt = input + (files.length > 0 ? ` [Attached ${files.length} file(s)]` : "");
    mutation.mutate(prompt, {
      onSuccess: (data) => {
        // We can pass context directly here or handle it in the global onSuccess
        // Let's rely on the global onSuccess for consistency
      }
    });

    setInput("");
    setFiles([]);
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
  }, [currentMessages.length, mutation.isPending]); // Use .length instead of the array reference

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-zinc-50">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats}
        activeChatId={activeChatId}
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
            {currentMessages.length === 1 && (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center max-w-lg mx-auto space-y-4">
                <Avatar className="h-16 w-16 bg-[#d97757] text-[#f4efe6]">
                  <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-medium tracking-tight text-zinc-800">
                  Good evening
                </h2>
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                  <Button variant="outline" className="h-auto py-3 px-4 justify-start text-left text-[14px] text-zinc-600 font-normal rounded-xl hover:bg-zinc-50 border-zinc-200" onClick={() => setInput("Extract text from image")}>
                    Extract text from image
                  </Button>
                  <Button variant="outline" className="h-auto py-3 px-4 justify-start text-left text-[14px] text-zinc-600 font-normal rounded-xl hover:bg-zinc-50 border-zinc-200" onClick={() => setInput("Help me write an essay")}>
                    Help me write an essay
                  </Button>
                  <Button variant="outline" className="h-auto py-3 px-4 justify-start text-left text-[14px] text-zinc-600 font-normal rounded-xl hover:bg-zinc-50 border-zinc-200" onClick={() => setInput("Summarize an article")}>
                    Summarize an article
                  </Button>
                  <Button variant="outline" className="h-auto py-3 px-4 justify-start text-left text-[14px] text-zinc-600 font-normal rounded-xl hover:bg-zinc-50 border-zinc-200" onClick={() => setInput("Brainstorm ideas")}>
                    Brainstorm ideas
                  </Button>
                </div>
              </div>
            )}

            {currentMessages.map((m, idx) => (
              m.id !== "init" || currentMessages.length > 1 ? (
                <div
                  key={m.id + idx}
                  className={cn(
                    "flex w-full",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn("flex max-w-[85%] gap-4 rounded-xl",
                    m.role === "assistant" ? "" : "bg-[#f4f4f4] px-5 py-4"
                  )}>
                    {m.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-[#d97757] text-[#f4efe6]">
                        <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      {m.role === "assistant" && (
                        <span className="text-[14px] font-semibold text-zinc-800">Claude</span>
                      )}
                      {m.files && m.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 mt-1">
                          {m.files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-xl pl-3 pr-3 py-2 shrink-0">
                              {f.type.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 text-zinc-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-zinc-500" />
                              )}
                              <span className="text-[13px] font-medium text-zinc-700 max-w-[150px] truncate">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.content && (
                        <div className={cn(
                          "prose prose-sm break-words max-w-none text-[15px] leading-relaxed",
                          m.role === "assistant" ? "text-zinc-800" : "text-zinc-800"
                        )}>
                          {m.content}
                        </div>
                      )}

                      {/* Assistant Message Actions */}
                      {m.role === "assistant" && (
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
              ) : null
            ))}

            {mutation.isPending && (
              <div className="flex w-full justify-start">
                <div className="flex max-w-[85%] gap-4">
                  <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-[#d97757] text-[#f4efe6]">
                    <AvatarFallback className="bg-[#d97757] text-[#f4efe6]">C</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-semibold text-zinc-800">Claude</span>
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
              placeholder="How can Claude help you today?"
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
                disabled={(!input.trim() && files.length === 0) || mutation.isPending}
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
            Claude can make mistakes. Please double-check responses.
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
