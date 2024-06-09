'use client';
import Link from 'next/link';

import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  Search,
  ShoppingCart,
  Users,
  MailSearch,
  Gauge,
  ReceiptText,
  Linkedin,
  Twitter,
  Github,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSession, signIn, signOut } from 'next-auth/react';

const ContactUs = () => {
  const { data: session, status } = useSession();

  return (
   <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <MailSearch className="h-6 w-6" />
              <span className="">Email-AI</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-lg font-large lg:px-4">
              <Link
                href="/dummy"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Gauge className="h-4 w-4" />
                Dashboard{' '}
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Users className="h-4 w-4" />
                Contact Us
              </Link>
              <Link
                href="/TermsAndService"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <ReceiptText className="h-4 w-4" />
                Terms And Conditions
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid items-start px-2 text-lg font-large lg:px-4">
                <Link
                  href="/dummy"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Gauge className="h-4 w-4" />
                  Dashboard{' '}
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Users className="h-4 w-4" />
                  Contact Us
                </Link>
                <Link
                  href="/TermsAndService"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <ReceiptText className="h-4 w-4" />
                  Terms And Conditions
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="ml-auto flex items-center space-x-4">
            <nav className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <span>
                      {session?.user?.name ? session.user.name : 'Login please'}
                    </span>
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="Profile" className="rounded-full w-8 h-8 m-3" />
                    ) : (
                      <CircleUser className="h-5 w-5" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session ? (
                    <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => signIn('google')}>Login</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
          <Card>
            <CardHeader>
              <h1>
                Contact us
              </h1>
            </CardHeader>
            <CardContent>
              <h3>
                This Project is by Siddhant Chakraborty, If you would like to contact the developer of this project click on the icons below to find his socials to connect with him.
              </h3>
            </CardContent>
            <CardFooter>
              <h4 className="flex justify-center items-center space-x-4">
                <Link href="https://twitter.com/">
                  <Twitter className="cursor-pointer" />
                </Link>
                <Link href="https://github.com/">
                  <Github className="cursor-pointer" />
                </Link>
                <Link href="https://www.linkedin.com/">
                  <Linkedin className="cursor-pointer" />
                </Link>
              </h4>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
