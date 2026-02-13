'use client';

import { type LucideIcon, MailIcon, PlusCircleIcon } from 'lucide-react';
import type * as React from 'react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import Link from 'next/link';
import { Button } from './ui/button';

export function NavSecondary({
    items,
    ...props
}: {
    items: {
        title: string;
        url: string;
        icon: LucideIcon;
    }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                                <a href={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center gap-2">
                        <SidebarMenuButton
                            tooltip="Quick Create"
                            className="min-w-8 bg-baltra-600 text-primary-foreground duration-200 ease-linear hover:bg-baltra-700 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                            asChild
                        >
                            <Link
                                href="https://wa.me/16505165164?text=Hola%20Baltra!%20Necesito%20ayuda%20con%20el%20sistema."
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <PlusCircleIcon />
                                <span>Soporte tecnico</span>
                            </Link>
                        </SidebarMenuButton>
                        <Button
                            asChild
                            size="icon"
                            className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
                            variant="outline"
                        >
                            <Link
                                href="mailto:info@baltra.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MailIcon />
                                <span className="sr-only">Inbox</span>
                            </Link>
                        </Button>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
