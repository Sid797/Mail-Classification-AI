'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import ReactSelect from 'react-select';
import moment from 'moment';
import { toast } from 'react-toastify'; 
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
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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

const customStyles = {
	tableWrapper: {
		style: {
      borderRadius: '10px',
		},
	},
  header: {
    style: {
      fontSize: "22px",
      fontWeight: "bold",
      color: "blue",

    },
  },
  headCells: {
    style: {
      fontSize: "18px",
      fontWeight: "bold",
      background: "#22c55e",
      paddingLeft: "16px",
      paddingRight: "16px",

    },
  },
  rows: {
    style: {
      borderRadius: '10px',
    },
  },
  cells: {
    style: {
      fontSize: "16px",
      paddingLeft: "16px",
      paddingRight: "16px",
      margin: '1rem',

      gap: '2rem',
    },
  },
  highlightOnHoverStyle: {
    backgroundColor: 'red',
  }
};

const customSelectStyles = {
  control: (base) => ({
    ...base,
    color: 'black',
	border:'none',
    borderRadius: '10px',
  }),
  menu: (base) => ({
    ...base,
    color: 'black',
  }),
  option: (base, state) => ({
    ...base,
    color: 'black',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'black',
  }),
};

const IntegratedDashboard = () => {
  const { data: session, status } = useSession();
  const [classification, setClassification] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filters, setFilters] = useState({
    important: true,
    promotions: true,
    social: true,
    marketing: true,
    spam: true,
    general: true,
    all: true,
  });

  const categories = ['Important', 'Promotions', 'Social', 'Marketing', 'Spam', 'General'];

   useEffect(() => {
    if (session?.accessToken) {
      const geminiApiKey = localStorage.getItem('geminiApiKey');
      if (!geminiApiKey) {
        toast.warn('Please enter your Gemini API key in the home page.');
      } else {
        setUserEmail(session.user.email);
        loadEmailsFromLocalStorage(session.user.email);
        fetchEmails(session.user.email, session.accessToken, null, false); // Initial fetch with prepend
      }
    }
  }, [session]);

  const loadEmailsFromLocalStorage = (email) => {
    const storedEmails = JSON.parse(localStorage.getItem(`classifiedEmails_${email}`)) || [];
    setClassification(storedEmails);
  };

  const fetchEmails = async (email, accessToken, pageToken, append = true) => {
    setLoading(true);
    try {
      const response = await axios.get('https://www.googleapis.com/gmail/v1/users/me/messages', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          maxResults: 25,
          pageToken: pageToken || undefined,
        },
      });

      const emailIds = response.data.messages.map(msg => msg.id);
      const emailPromises = emailIds.map(id =>
        axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      const emails = await Promise.all(emailPromises);

      const emailData = emails.map(email => {
        const subjectHeader = email.data.payload.headers.find(header => header.name === 'Subject');
        const dateHeader = email.data.payload.headers.find(header => header.name === 'Date');
        return {
          id: email.data.id,
          title: subjectHeader ? subjectHeader.value : '(No Subject)',
          date: dateHeader ? moment(dateHeader.value).format('YYYY-MM-DD HH:mm:ss') : 'Unknown',
        };
      });

      const storedEmails = JSON.parse(localStorage.getItem(`classifiedEmails_${email}`)) || [];
      const storedEmailIds = storedEmails.map(email => email.id);
      const newEmails = emailData.filter(email => !storedEmailIds.includes(email.id));

      if (newEmails.length > 0) {
        const titles = newEmails.map(email => email.title);
        const result = await axios.post('/api/classifyEmails', { emailTitles: titles });
        const classifiedEmails = result.data.classifiedEmails || [];

        const emailsWithClassification = newEmails.map((email, index) => ({
          ...email,
          category: classifiedEmails[index] ? classifiedEmails[index].category : 'Uncategorized',
        }));

        const updatedEmails = append ? [...storedEmails, ...emailsWithClassification] : [...emailsWithClassification, ...storedEmails];
        localStorage.setItem(`classifiedEmails_${email}`, JSON.stringify(updatedEmails));
        setClassification(updatedEmails);
      } else {
        setClassification(storedEmails);
      }

      setNextPageToken(response.data.nextPageToken || null);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setClassification([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (selectedOptions) => {
    setSelectedFilters(selectedOptions || []);
    const selectedValues = selectedOptions?.map(option => option.value) || [];
    const newFilters = categories.reduce((acc, category) => {
      acc[category.toLowerCase()] = selectedValues.includes(category.toLowerCase());
      return acc;
    }, {});

    newFilters.all = selectedValues.includes('all') || selectedValues.length === 0;
    setFilters(newFilters);
  };

  const filteredEmails = classification.filter(email => {
    const matchesSearch = email.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filters.all || filters[email.category.toLowerCase()];
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      name: 'Category',
      selector: row => row.category,
      sortable: true,
    },
    {
      name: 'Email Title',
      selector: row => row.title,
      cell: row => (
        <a href={`https://mail.google.com/mail/u/0/#inbox/${row.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
          {row.title}
        </a>
      ),
      sortable: true,
    },
    {
      name: 'Date Received',
      selector: row => row.date,
      sortable: true,
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'All' },
    ...categories.map(category => ({
      value: category.toLowerCase(),
      label: category,
    })),
  ];

  const handleLoadMore = () => {
    if (nextPageToken) {
      fetchEmails(userEmail, session.accessToken, nextPageToken, true);
    } else {
      console.log('No more emails to load');
    }
  };

  const handleRefresh = () => {
    fetchEmails(userEmail, session.accessToken, null, false);
  };

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
        <main className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Classification</CardTitle>
              <CardDescription>
                Emails classified by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Input
                  type="text"
                  placeholder="Search by title"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-80"
                />
                <ReactSelect
                  isMulti
                  options={filterOptions}
                  onChange={handleFilterChange}
                  placeholder="Filter by category"
                  styles={customSelectStyles}
                />
                <Button onClick={handleLoadMore} className="ml-2">
                  Load More
                </Button>
                <Button onClick={handleRefresh} className="ml-2">
                  Refresh
                </Button>
              </div>
              <DataTable 
                customStyles={customStyles} 
                theme="dark" 
                columns={columns} 
                data={filteredEmails} 
                pagination 
                highlightOnHover 
                pointerOnHover 
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default IntegratedDashboard;
