"use client";

import { Logo } from "@/components/pro-blocks/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Menu, Zap, Search, Terminal, X, ArrowRight } from "lucide-react";
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
        : "text-muted-foreground hover:bg-primary/5"
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

export function Settings1() {
  return (
    <div className="bg-secondary min-h-screen">
      {/* Use the inline Navbar component - Restored for preview */}
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
              <Select defaultValue="billing">
                <SelectTrigger>
                  <SelectValue placeholder="Select setting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar - hidden on mobile, no border */}
          <aside className="hidden w-64 py-6 pr-6 md:block">
            <ul className="-ml-3 space-y-1">
              <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>Profile</a>
              </li>
              <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>Account</a>
              </li>
              <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>Members</a>
              </li>
              <li className="hover:bg-accent-foreg bg-accent-foreground/5 text-accent-foreground cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>Billing</a>
              </li>
              <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>Invoices</a>
              </li>
              <li className="text-muted-foreground hover:bg-accent-foreground/10 cursor-pointer rounded-md px-3 py-2 text-sm font-medium">
                <a>API</a>
              </li>
            </ul>
          </aside>

          {/* Main content */}
          <main className="flex-1 py-4 md:py-6">
            <Card className="bg-primary text-primary-foreground mb-4">
              <CardContent className="flex flex-col items-start justify-between px-6 md:flex-row md:items-center">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    <h3 className="font-semibold">You're using free plan</h3>
                  </div>
                  <p className="text-primary-foreground/80 mt-1 text-sm">
                    You can add components to your app by upgrading to the next
                    plan.
                  </p>
                </div>
                <Button variant="secondary" className="w-full md:w-auto">
                  View plans
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Card details section */}
            <Card className="mb-4">
              <CardHeader className="px-6 pb-0">
                <CardTitle className="text-xl">Card details</CardTitle>
                <p className="text-muted-foreground text-sm">
                  View and update your card details here.
                </p>
              </CardHeader>
              <CardContent className="px-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nameOnCard">Name on card</Label>
                      <Input id="nameOnCard" defaultValue="Kathy Pacheco" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card number</Label>
                      <Input
                        id="cardNumber"
                        defaultValue="1414 1412 4141 1422"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" defaultValue="05/2025" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" defaultValue="***" type="password" />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6">
                <Button>Save</Button>
              </CardFooter>
            </Card>

            {/* Client details section */}
            <Card>
              <CardHeader className="px-6">
                <CardTitle className="text-xl">Client details</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Update personal information.
                </p>
              </CardHeader>
              <CardContent className="px-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client name</Label>
                      <Input id="clientName" defaultValue="Kathy Pacheco" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAddress">Email address</Label>
                      <Input
                        id="emailAddress"
                        type="email"
                        defaultValue="kathy_pacheco@mail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select defaultValue="US">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          {/* Add more countries as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress">Street address</Label>
                      <Input
                        id="streetAddress"
                        defaultValue="2825 Winding Way, Providence, RI 02908"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" defaultValue="Providence" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select defaultValue="RI">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          {/* Add more states as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6">
                <Button>Save</Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
