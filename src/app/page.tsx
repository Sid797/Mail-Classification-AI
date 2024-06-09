'use client';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";  // Assuming the Input component is here
import { Button } from "@/components/ui/button";  // Assuming the Button component is here
import { WavyBackground } from "@/components/ui/wavy-background";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);

  useEffect(() => {
    // Check if the Gemini API key is already saved
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeySaved(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('geminiApiKey', apiKey);
    setIsApiKeySaved(true);
    toast.success('API Key entered!');
  };

  return (
    <WavyBackground className="flex flex-col justify-center min-h-screen py-2">
      <h1 className="text-6xl font-bold mb-4">EMAILa-AI</h1>
      <p className="text-xl mb-12">Classify emails with ease</p>
      
      <ol className="relative text-gray-500 border-s border-gray-200 dark:border-gray-700 dark:text-gray-400">                  
        <li className="mb-10 ms-6">            
          <span className="absolute flex items-center justify-center w-8 h-8 bg-green-200 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-green-900">
            <svg className="w-3.5 h-3.5 text-green-500 dark:text-green-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5"/>
            </svg>
          </span>
          <h3 className="font-medium leading-tight">API Key</h3>
          {isApiKeySaved ? (
            <p className="text-sm">A key already exists. If you want to change it, enter a new key below:</p>
          ) : (
            <p className="text-sm">Please enter your Gemini API key below:</p>
          )}
          <Input 
            type="text" 
            placeholder="Enter your Gemini API key" 
            className="mt-2" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
          />
          <Button onClick={handleSaveApiKey} className="mt-2">Save API Key</Button>
        </li>
        <li className="mb-10 ms-6">
          <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
              <path d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z"/>
            </svg>
          </span>
          <h3 className="font-medium leading-tight">Account Info</h3>
          <p className="text-sm">Please log in to proceed</p>
          <Button onClick={() => signIn('google')} className="mt-2">Login</Button>
        </li>
        <li className="ms-6">
          <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
              <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2ZM7 2h4v3H7V2Zm5.7 8.289-3.975 3.857a1 1 0 0 1-1.393 0L5.3 12.182a1.002 1.002 0 1 1 1.4-1.436l1.328 1.289 3.28-3.181a1 1 0 1 1 1.392 1.435Z"/>
            </svg>
          </span>
          <h3 className="font-medium leading-tight">Confirmation</h3>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="mt-2" 
            disabled={!isApiKeySaved || status !== 'authenticated'}
          >
            Let's Go
          </Button>
        </li>
      </ol>
    </WavyBackground>
  );
};

export default HomePage;

