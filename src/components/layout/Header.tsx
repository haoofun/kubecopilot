import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui-kit/dropdown-menu'
import { Button } from '@ui-kit/button'
import { CircleUser } from 'lucide-react'

import { CommandPalette } from '@/components/command-palette'
import { GlobalSearchBar } from './GlobalSearchBar'

export function Header() {
  return (
    <header className="bg-muted/40 sticky top-0 z-30 flex h-12 items-center border-b px-4 lg:h-[56px] lg:px-6">
      <div className="flex w-full items-center gap-4">
        <GlobalSearchBar className="hidden flex-1 md:flex" />
        <div className="ml-auto flex items-center gap-3">
          <CommandPalette />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
