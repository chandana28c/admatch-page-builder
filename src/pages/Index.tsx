import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Link, Sparkles, ArrowRight, Zap, Eye, Shield } from 'lucide-react';

const Index = () => {
  const [adInputMode, setAdInputMode] = useState<'upload' | 'url'>('upload');
  const [adUrl, setAdUrl] = useState('');
  const [adImage, setAdImage] = useState<string | null>(null);
  const [adFileName, setAdFileName] = useState('');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAdImage(reader.result as string);
      setAdFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAdImage(reader.result as string);
      setAdFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!landingPageUrl.trim()) {
      toast({ title: 'Missing URL', description: 'Enter a landing page URL', variant: 'destructive' });
      return;
    }
    if (adInputMode === 'upload' && !adImage) {
      toast({ title: 'Missing ad', description: 'Upload an ad image', variant: 'destructive' });
      return;
    }
    if (adInputMode === 'url' && !adUrl.trim()) {
      toast({ title: 'Missing ad URL', description: 'Enter an ad creative URL', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Scrape landing page
      setLoadingStep('Scraping landing page...');
      const { firecrawlApi } = await import('@/lib/api/firecrawl');
      const scrapeResult = await firecrawlApi.scrape(landingPageUrl);

      if (!scrapeResult.success || !scrapeResult.data) {
        throw new Error(scrapeResult.error || 'Failed to scrape landing page');
      }

      // Step 2: Personalize
      setLoadingStep('Analyzing ad & generating personalized page...');
      const { personalizeLanding } = await import('@/lib/api/personalize');
      const result = await personalizeLanding({
        adImageBase64: adInputMode === 'upload' ? adImage || undefined : undefined,
        adUrl: adInputMode === 'url' ? adUrl : undefined,
        originalHtml: scrapeResult.data.html,
        originalMarkdown: scrapeResult.data.markdown,
        branding: scrapeResult.data.branding,
        landingPageUrl,
      });

      if (!result.success || !result.personalizedHtml) {
        throw new Error(result.error || 'Personalization failed');
      }

      // Navigate to results
      navigate('/results', {
        state: {
          originalHtml: scrapeResult.data.html,
          personalizedHtml: result.personalizedHtml,
          changes: result.changes || [],
          landingPageUrl,
          screenshot: scrapeResult.data.screenshot,
        },
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      toast({ title: 'Error', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{loadingStep}</h2>
            <p className="text-muted-foreground">This may take 30–60 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              Troopod
            </span>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">AI-Powered Landing Page Personalizer</p>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Personalize landing pages
            <br />
            <span className="text-primary">from your ads</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Paste your ad creative and landing page URL. Our AI applies CRO best practices to boost conversions with message-matched personalization.
          </p>
        </div>

        {/* Input Card */}
        <Card className="max-w-2xl mx-auto shadow-lg border-2">
          <CardContent className="p-8 space-y-8">
            {/* Ad Creative Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Ad Creative</label>
              <Tabs value={adInputMode} onValueChange={(v) => setAdInputMode(v as 'upload' | 'url')}>
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-2">
                    <Upload className="w-4 h-4" /> Upload Image
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex-1 gap-2">
                    <Link className="w-4 h-4" /> Ad URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('ad-upload')?.click()}
                  >
                    {adImage ? (
                      <div className="space-y-3">
                        <img src={adImage} alt="Ad preview" className="max-h-40 mx-auto rounded-md" />
                        <p className="text-sm text-muted-foreground">{adFileName}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drop your ad image here or <span className="text-primary font-medium">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      id="ad-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="url" className="mt-3">
                  <Input
                    placeholder="https://example.com/ad-image.jpg"
                    value={adUrl}
                    onChange={(e) => setAdUrl(e.target.value)}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Landing Page URL */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Landing Page URL</label>
              <Input
                placeholder="https://yoursite.com/landing-page"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              size="lg"
              className="w-full text-base gap-2"
              onClick={handleGenerate}
            >
              Generate Personalized Page <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Zap, title: 'Message Match', desc: 'Aligns headlines & CTAs with your ad copy' },
            { icon: Eye, title: 'CRO Optimized', desc: 'Above-the-fold optimization & social proof' },
            { icon: Shield, title: 'Safe Changes', desc: 'Surgical edits — never breaks your page' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center space-y-2 p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
