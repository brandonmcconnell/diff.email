"use client";

import { Logo } from "@/components/pro-blocks/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Menu, Zap, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Navbar2() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Mobile top bar component
  const MobileTopBar = () => (
    <div
      className={`bg-background flex h-14 items-center justify-between px-4 ${
        !isMenuOpen ? "border-border border-b" : ""
      }`}
    >
      {/* Mobile menu toggle button */}
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

      {/* Logo */}
      <Logo className="absolute left-1/2 h-8 w-8 -translate-x-1/2 transform" />

      {/* Mobile upgrade button */}
      <div className="absolute right-4 flex items-center gap-3">
        <Button className="h-9 w-9 p-0 [&_svg]:size-5">
          <Zap />
        </Button>
      </div>
    </div>
  );

  // Navigation items component
  const NavItems = ({ isMobile = false }) => {
    const linkClasses = `font-medium ${isMobile ? "text-base" : "text-sm"} ${
      isMobile
        ? "text-muted-foreground"
        : "text-muted-foreground hover:bg-muted/50"
    } px-3 py-2 rounded-md`;

    return (
      <>
        {/* Main navigation links */}
        <Link href="#" className={linkClasses}>
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
      {/* Desktop Navbar */}
      <nav className="border-border bg-background hidden h-16 border-b shadow-sm lg:block">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          {/* Left section: Logo */}
          <div className="flex items-center gap-x-4">
            <Logo />
          </div>
          {/* Right section: user menu and button */}
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-1">
              <NavItems />
            </div>
            <Button>
              <Zap className="h-4 w-4" /> Upgrade
            </Button>
            {/* User menu dropdown */}
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
            {/* New item button */}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="lg:hidden">
        <MobileTopBar />
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="border-border bg-background border-b lg:hidden">
          <div className="flex flex-col">
            {/* Mobile menu content */}
            <div className="flex-grow overflow-y-auto p-2">
              <div className="flex flex-col">
                <NavItems isMobile={true} />
              </div>
            </div>
            <Separator />
            {/* Mobile user profile section */}
            <div className="p-2">
              {/* User info */}
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
              {/* User-related links */}
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

export function Settings7() {
  return (
    <div className="bg-background">
      <div className="bg-muted/40 min-h-screen">
        {/* Use the inline Navbar component */}
        <Navbar2 />
        <div className="border-border bg-background border-b">
          <div className="container mx-auto flex flex-col px-4 py-4 md:px-6 md:py-6">
            {/* Main content */}
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Settings
                </h1>
              </div>
              {/* Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform" />
                <Input type="search" placeholder="Search" className="pl-8" />
              </div>
              {/* Mobile-only dropdown */}
              <div className="md:hidden">
                <Select defaultValue="account">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="notifications">Notifications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar - hidden on mobile, no border */}
            <aside className="hidden w-64 py-6 md:block">
              <ul className="-ml-3 space-y-1">
                <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Profile</a>
                </li>
                <li className="bg-accent-foreground/5 text-accent-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Account</a>
                </li>
                <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Members</a>
                </li>
                <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Billing</a>
                </li>
                <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Invoices</a>
                </li>
                <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                  <a>Notifications</a>
                </li>
              </ul>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-0 py-4 md:py-6 md:pl-6">
                <div className="flex flex-col gap-4 md:gap-6">
                  {/* Avatar Card */}
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-semibold md:text-xl">
                        Avatar
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Avatar is your profile picture - everyone who visits
                        your profile will see this.
                      </p>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="User avatar"
                        />
                      </Avatar>
                      <Button variant="outline">
                        <Upload />
                        Upload
                      </Button>
                    </CardContent>
                    <CardFooter className="flex items-center justify-start border-t md:justify-end">
                      <Button>Save</Button>
                    </CardFooter>
                  </Card>

                  {/* Display Name Card */}
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-semibold md:text-xl">
                        Display name
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Enter your full name or a display name you'd like to
                        use.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Input
                        defaultValue="Shadcn Design"
                        className="max-w-[317px]"
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col items-start justify-between gap-3 border-t md:flex-row md:items-center">
                      <p className="text-muted-foreground text-sm">
                        Maximum allowed length is 32 characters.
                      </p>
                      <Button>Save</Button>
                    </CardFooter>
                  </Card>

                  {/* Teams Card */}
                  <Card>
                    <CardHeader>
                      <h2 className="text-lg font-semibold md:text-xl">
                        Teams
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Here is your URL namespace for use in our app.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Table className="w-full min-w-[480px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Team name</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">
                              Permissions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              Shadcn Design Team
                            </TableCell>
                            <TableCell>5 September 2024</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Admin</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Vercel Team
                            </TableCell>
                            <TableCell>2 August 2024</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Admin</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Figma Team
                            </TableCell>
                            <TableCell>14 January 2023</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Designer</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Next JS Team
                            </TableCell>
                            <TableCell>11 May 2023</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">Developer</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start justify-end gap-3 border-t md:flex-row md:items-center">
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="order-2 md:order-1"
                        >
                          Edit
                        </Button>
                        <Button className="order-1 md:order-2">Save</Button>
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Delete Account Card */}
                  <Card>
                    <CardHeader>
                      <h2 className="text-xl font-semibold">Delete account</h2>
                      <p className="text-muted-foreground text-sm">
                        This will permanently delete your Personal Account.
                        Please note that this action is irreversible, so proceed
                        with caution.
                      </p>
                    </CardHeader>
                    <CardFooter className="flex flex-col items-start justify-between gap-3 border-t md:flex-row md:items-center">
                      <p className="text-destructive text-sm">
                        This action cannot be undone!
                      </p>
                      <Button variant="destructive">Delete account</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
