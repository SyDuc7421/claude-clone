"use client";

import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export type ChatItem = {
    id: string;
    title: string;
    updatedAt: number;
};

interface AppSidebarProps {
    chats: ChatItem[];
    activeChatId: string | null;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    onRenameChat: (id: string, newTitle: string) => void;
    onDeleteChat: (id: string) => void;
}

export function AppSidebar({
    chats,
    activeChatId,
    onSelectChat,
    onNewChat,
    onRenameChat,
    onDeleteChat,
}: AppSidebarProps) {
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const handleEditStart = (chat: ChatItem) => {
        setEditingChatId(chat.id);
        setEditTitle(chat.title);
    };

    const handleEditSave = (id: string) => {
        if (editTitle.trim()) {
            onRenameChat(id, editTitle.trim());
        }
        setEditingChatId(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === "Enter") {
            handleEditSave(id);
        } else if (e.key === "Escape") {
            setEditingChatId(null);
        }
    };

    // Sort chats by updatedAt desc
    const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <Sidebar className="border-r-0 bg-[#f9f8f6]">
            <SidebarHeader className="bg-transparent px-4 py-4 mt-2">
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground shadow-sm bg-white hover:bg-white cursor-pointer"
                    onClick={onNewChat}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New chat
                </Button>
            </SidebarHeader>
            <SidebarContent className="bg-transparent px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">Recent</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sortedChats.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={chat.id === activeChatId}
                                        className={cn(
                                            "group flex w-full justify-between items-center cursor-pointer",
                                            chat.id === activeChatId ? "bg-zinc-200/50 hover:bg-zinc-200/50" : "hover:bg-zinc-200/50"
                                        )}
                                        onClick={() => {
                                            if (editingChatId !== chat.id) {
                                                onSelectChat(chat.id);
                                            }
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between overflow-hidden px-2">
                                            {editingChatId === chat.id ? (
                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onBlur={() => handleEditSave(chat.id)}
                                                    onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                                                    className="h-7 text-[13px] px-2 py-0 focus-visible:ring-1 focus-visible:ring-zinc-300"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <span className="text-[13px] text-zinc-700 group-hover:text-zinc-900 overflow-hidden text-ellipsis whitespace-nowrap block w-full outline-none select-none">
                                                        {chat.title}
                                                    </span>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1",
                                                                    chat.id === activeChatId ? "opacity-100" : ""
                                                                )}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditStart(chat);
                                                                }}
                                                                className="cursor-pointer gap-2 py-2"
                                                            >
                                                                <Pencil className="h-4 w-4 text-zinc-500" />
                                                                <span className="text-[13px]">Rename</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteChat(chat.id);
                                                                }}
                                                                className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="text-[13px]">Delete</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
