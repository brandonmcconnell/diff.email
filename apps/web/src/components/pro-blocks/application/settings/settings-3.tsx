"use client";

import { Logo } from "@/components/pro-blocks/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Menu, Zap, Search, X, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function Navbar1() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const MobileTopBar = () => (
    <div
      className={`bg-background flex h-14 items-center justify-between px-4 ${
        !isMenuOpen ? "border-border border-b" : ""
      }`}
    >
      <Button
        variant="ghost"
        onClick={toggleMenu}
        className="relative -ml-2 flex h-9 w-9 items-center justify-center [&_svg]:size-5"
      >
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        >
          <Menu />
        </span>
        <span
          className={`absolute transition-all duration-300 ${
            isMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
        >
          <X />
        </span>
      </Button>

      <Logo className="absolute left-1/2 h-8 w-8 -translate-x-1/2 transform" />

      <div className="absolute right-4 flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 p-0 [&_svg]:size-5">
          <Search className="text-muted-foreground" />
        </Button>
        <Button className="h-9 w-9 p-0 [&_svg]:size-5">
          <Zap />
        </Button>
      </div>
    </div>
  );

  const NavItems = ({ isMobile = false }) => {
    const linkClasses = `font-medium ${isMobile ? "text-base" : "text-sm"} ${
      isMobile
        ? "text-muted-foreground"
        : "text-muted-foreground hover:bg-primary/5"
    } px-3 py-2 rounded-md`;

    return (
      <>
        <Link href="#" className={`${linkClasses}`}>
          Dashboard
        </Link>
        <Link href="#" className={linkClasses}>
          Orders
        </Link>
        <Link href="#" className={linkClasses}>
          Products
        </Link>
        <Link href="#" className={linkClasses}>
          Customers
        </Link>
        <Link href="#" className={`${linkClasses} text-primary`}>
          Settings
        </Link>
      </>
    );
  };

  return (
    <>
      <nav className="border-border bg-background hidden h-16 border-b shadow-sm lg:block">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-x-4">
            <Logo />
            <div className="flex items-center gap-x-1">
              <NavItems />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="text-muted-foreground h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>My Profile</DropdownMenuItem>
                <DropdownMenuItem>Account</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <Zap className="h-4 w-4" /> Upgrade
            </Button>
          </div>
        </div>
      </nav>

      <nav className="lg:hidden">
        <MobileTopBar />
      </nav>

      {isMenuOpen && (
        <div className="border-border bg-background border-b lg:hidden">
          <div className="flex flex-col">
            <div className="flex-grow overflow-y-auto p-2">
              <div className="flex flex-col">
                <NavItems isMobile={true} />
              </div>
            </div>
            <Separator />
            <div className="p-2">
              <div className="flex items-center space-x-3 p-2">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-muted-foreground text-sm">
                    hi@shadcndesign.com
                  </p>
                </div>
              </div>
              <div>
                <Link
                  href="#"
                  className="text-muted-foreground block rounded-md px-2 py-2 font-medium"
                >
                  My profile
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground block rounded-md px-2 py-2 font-medium"
                >
                  Account settings
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground block rounded-md px-2 py-2 font-medium"
                >
                  Billing
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground block rounded-md px-2 py-2 font-medium"
                >
                  Sign out
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Page Header

function PageHeader3() {
  return (
    <div className="border-border bg-background border-b pt-0 pb-4 md:pb-6">
      <nav className="border-border mb-6 border-b">
        <div className="container mx-auto flex overflow-x-auto px-4 lg:px-3">
          <Link
            href="#"
            className="text-foreground flex-shrink-0 py-1.5 text-sm"
          >
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">
              Profile
            </span>
          </Link>
          <Link
            href="#"
            className="text-muted-foreground flex-shrink-0 py-1.5 text-sm"
          >
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">
              Account
            </span>
          </Link>
          <Link
            href="#"
            className="text-muted-foreground flex-shrink-0 py-1.5 text-sm"
          >
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">
              Analytics
            </span>
          </Link>
          <Link
            href="#"
            className="border-primary text-foreground flex-shrink-0 border-b-2 py-1.5 text-sm"
          >
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">
              API
            </span>
          </Link>
          <Link
            href="#"
            className="text-muted-foreground flex-shrink-0 py-1.5 text-sm"
          >
            <span className="hover:bg-muted block rounded-md px-2.5 py-2">
              Members
            </span>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              API Settings
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Configure your API settings. Add, remove or edit existing API
              keys.
            </p>
          </div>

          <div>
            <Button variant="outline">Contact support</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Settings3() {
  return (
    <div className="bg-background">
      <Navbar1 />
      <PageHeader3 />
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        {/* Public API Settings */}
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl font-semibold">
                Public API Settings
              </CardTitle>
              <CardDescription>
                Manage and configure access to the Public API.
              </CardDescription>
            </div>
            <Button>
              <Plus />
              New
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">API Name</TableHead>
                    <TableHead className="hidden font-medium sm:table-cell">
                      Date of Creation
                    </TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Public Data API
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Sep 6, 2024 2:08 am
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary">Active</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Product Info API
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Sep 12, 2024 2:07 pm
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary">Active</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">User Data API</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Aug 20, 2024 7:59 am
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Revoke</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Private API Settings */}
        <Card>
          <CardHeader className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl font-semibold">
                Private API Settings
              </CardTitle>
              <CardDescription>
                Manage and configure access to the Private API.
              </CardDescription>
            </div>
            <Button>
              <Plus />
              New
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">API Name</TableHead>
                    <TableHead className="hidden font-medium sm:table-cell">
                      Date of Creation
                    </TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Internal Data API
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Sep 1, 2024 7:53 pm
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary">Active</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Auth Service API
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Aug 29, 2024 9:18 pm
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary">Active</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Billing API</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Aug 19, 2024 8:51 pm
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-destructive">Disabled</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
