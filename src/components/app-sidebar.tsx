"use client";

import { MessageSquare, Plus, Check } from "lucide-react";
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

const recentChats = [
    { id: "1", title: "React Query Architecture", time: "Today" },
    { id: "2", title: "Refactoring components", time: "Yesterday" },
    { id: "3", title: "Explain Server Components", time: "Previous 7 days" },
    { id: "4", title: "CSS Grid layout examples", time: "Previous 7 days" },
];

export function AppSidebar() {
    return (
        <Sidebar className="border-r-0 bg-[#f9f8f6]">
            <SidebarHeader className="bg-transparent px-4 py-4 mt-2">
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground shadow-sm bg-white hover:bg-white"
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
                            {recentChats.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton asChild>
                                        <a
                                            href={`/chat/${chat.id}`}
                                            className="text-[13px] text-zinc-700 hover:text-zinc-900 overflow-hidden text-ellipsis whitespace-nowrap block w-full px-2"
                                        >
                                            {chat.title}
                                        </a>
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
