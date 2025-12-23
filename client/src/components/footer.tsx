import { useState } from 'react';
// import removed: useLanguage
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, Bug, MessageSquare } from 'lucide-react';

export function Footer() {
  const t: any = {};
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Error" || 'Empty field',
        description: "Please write your message" || 'Please write your message',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Open email client with pre-filled message
      const subject = encodeURIComponent('Code Flow - Suggestion/Bug');
      const body = encodeURIComponent(message);
      const mailtoLink = `mailto:codeflowbr@outlook.com?subject=${subject}&body=${body}`;
      
      window.location.href = mailtoLink;
      
      toast({
        title: "Thank you" || 'Email opened!',
        description: "Your message was prepared in your email client." || 'Your email client was opened with the message',
      });

      setMessage('');
    } catch (error) {
      toast({
        title: "Error" || 'Error',
        description: "Could not open email client" || 'Could not open email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900/50 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-white">
                {"Suggestions & Bugs" || 'Suggestions & Bugs'}
              </h3>
            </div>
            
            <p className="text-sm text-gray-400">
              {"Help us improve! Send suggestions or report bugs directly to our team." || 'Help us improve! Send suggestions or report bugs directly to our team.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                placeholder="Describe your suggestion or the bug you found..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] bg-slate-800/50 border-slate-700 focus:border-primary resize-none"
                maxLength={1000}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {message.length}/1000
                </span>
                <Button 
                  type="submit" 
                  disabled={loading || !message.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {"Send" || 'Send'}
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
              <Mail className="w-4 h-4" />
              <a 
                href="mailto:codeflowbr@outlook.com" 
                className="hover:text-primary transition-colors"
              >
                codeflowbr@outlook.com
              </a>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bug className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">
                {"How to Help" || 'How to Help'}
              </h3>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">
                  {"Report Bugs" || '🐛 Report Bugs'}
                </h4>
                <p className="text-gray-400">
                  {"Found something not working? Describe the problem in detail so we can fix it quickly." || 'Found something not working? Describe the problem in detail so we can fix it quickly.'}
                </p>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">
                  {"Suggestions" || '💡 Suggestions'}
                </h4>
                <p className="text-gray-400">
                  {"Have an idea to improve Code Flow? Share it with us!" || 'Have an idea to improve Code Flow? Share it with us! We love community feedback.'}
                </p>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="font-semibold text-white mb-2">
                  {"New Features" || '✨ New Features'}
                </h4>
                <p className="text-gray-400">
                  {"Want to see a new feature in Code Flow? Send your proposal." || 'Want to see a new feature in Code Flow? Send your proposal and it may become reality!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Code Flow BR. {"All rights reserved." || 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
