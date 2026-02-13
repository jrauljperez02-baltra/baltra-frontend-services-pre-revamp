import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export function NavUserSkeleton() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="cursor-default">
                    {/* Avatar skeleton */}
                    <Skeleton className="h-8 w-8 rounded-lg" />

                    {/* Text content skeleton */}
                    <div className="grid flex-1 gap-1 text-left">
                        {/* Name skeleton */}
                        <Skeleton className="h-4 w-24" />
                        {/* Email skeleton */}
                        <Skeleton className="h-3 w-32" />
                    </div>

                    {/* More icon skeleton */}
                    <Skeleton className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
