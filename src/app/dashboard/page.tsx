'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import axios from 'axios';
import DataTable, { TableColumn } from 'react-data-table-component';
import ReactSelect, { StylesConfig, MultiValue, ActionMeta } from 'react-select';
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

interface Email {
  id: string;
  title: string;
  date: string;
  category: string;
}

interface Filters {
  important: boolean;
  promotions: boolean;
  social: boolean;
  marketing: boolean;
  spam: boolean;
  general: boolean;
  all: boolean;
}

const customStyles = {
  tableWrapper: {
    style: {
      borderRadius: '10px',
    },
  },
  header: {
    style: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: 'blue',
    },
  },
  headCells: {
    style: {
      fontSize: '18px',
      fontWeight: 'bold',
      background: '#22c55e',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      borderRadius: '10px',
    },
  },
  cells: {
    style: {
      fontSize: '16px',
      paddingLeft: '16px',
      paddingRight: '16px',
      margin: '1rem',
      gap: '2rem',
    },
  },
  highlightOnHoverStyle: {
    backgroundColor: 'red',
  },
};

const customSelectStyles: StylesConfig<{ value: string; label: string }, true> = {
  control: (base) => ({
    ...base,
    color: 'black',
    border: 'none',
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
  const [classification, setClassification] = useState<Email[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [filters, setFilters] = useState<Filters>({
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
      } else if (session.user?.email) {
        setUserEmail(session.user.email);
        loadEmailsFromLocalStorage(session.user.email);
        fetchEmails(session.user.email, session.accessToken, null, false);
      }
    }
  }, [session]);

  const loadEmailsFromLocalStorage = (email: string) => {
    const storedEmails: Email[] = JSON.parse(localStorage.getItem(`classifiedEmails_${email}`) || '[]');
    setClassification(storedEmails);
  };

  const fetchEmails = async (email: string, accessToken: string, pageToken: string | null, append: boolean = true) => {
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

      const emailIds: string[] = response.data.messages.map((msg: { id: string }) => msg.id);
      const emailPromises = emailIds.map((id: string) =>
        axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      const emails = await Promise.all(emailPromises);

      const emailData: Email[] = emails.map((email: any) => {
        const subjectHeader = email.data.payload.headers.find((header: any) => header.name === 'Subject');
        const dateHeader = email.data.payload.headers.find((header: any) => header.name === 'Date');
        return {
          id: email.data.id,
          title: subjectHeader ? subjectHeader.value : '(No Subject)',
          date: dateHeader ? moment(dateHeader.value).format('YYYY-MM-DD HH:mm:ss') : 'Unknown',
          category: 'Uncategorized', // Temporary default value, will be updated later
        };
      });

      const storedEmails: Email[] = JSON.parse(localStorage.getItem(`classifiedEmails_${email}`) || '[]');
      const storedEmailIds: string[] = storedEmails.map((email: Email) => email.id);
      const newEmails = emailData.filter((email: Email) => !storedEmailIds.includes(email.id));

      if (newEmails.length > 0) {
        const titles = newEmails.map((email: Email) => email.title);
        const result = await axios.post('/api/classifyEmails', { emailTitles: titles });
        const classifiedEmails: { category: string }[] = result.data.classifiedEmails || [];

        const emailsWithClassification: Email[] = newEmails.map((email, index) => ({
          ...email,
          category: classifiedEmails[index] ? classifiedEmails[index].category : 'Uncategorized',
        }));

        const updatedEmails: Email[] = append ? [...storedEmails, ...emailsWithClassification] : [...emailsWithClassification, ...storedEmails];
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

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (
    newValue: MultiValue<{ value: string; label: string }>,
    actionMeta: ActionMeta<{ value: string; label: string }>
  ) => {
    setSelectedFilters(newValue || []);
    const selectedValues = newValue?.map(option => option.value) || [];
    const newFilters: Filters = categories.reduce((acc, category) => {
      acc[category.toLowerCase() as keyof Filters] = selectedValues.includes(category.toLowerCase());
      return acc;
    }, {} as Filters);

    newFilters.all = selectedValues.includes('all') || selectedValues.length === 0;
    setFilters(newFilters);
  };

  const filteredEmails = classification.filter(email => {
    const matchesSearch = email.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filters.all || filters[email.category.toLowerCase() as keyof Filters];
    return matchesSearch && matchesFilter;
  });

  const columns: TableColumn<Email>[] = [
    {
      name: 'Category',
      selector: (row: Email) => row.category,
      sortable: true,
    },
    {
      name: 'Email Title',
      selector: (row: Email) => row.title,
      cell: (row: Email) => (
        <a href={`https://mail.google.com/mail/u/0/#inbox/${row.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
          {row.title}
        </a>
      ),
      sortable: true,
    },
    {
      name: 'Date',
      selector: (row: Email) => row.date,
      sortable: true,
    },
  ];

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    signIn();
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Email Dashboard</h1>
      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={handleSearch}
          className="mr-2"
        />
        <ReactSelect
          isMulti
          options={categories.map(category => ({ value: category.toLowerCase(), label: category }))}
          value={selectedFilters}
          onChange={handleFilterChange}
          styles={customSelectStyles}
          placeholder="Filter by category"
        />
      </div>
      <DataTable
        columns={columns}
        data={filteredEmails}
        customStyles={customStyles}
        highlightOnHover
        pointerOnHover
        pagination
      />
      {nextPageToken && (
        <div className="mt-4">
          <Button onClick={() => fetchEmails(userEmail, session!.accessToken!, nextPageToken)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default IntegratedDashboard;
