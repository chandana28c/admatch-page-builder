import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Change {
  element: string;
  original: string;
  modified: string;
  rationale: string;
}

const HtmlPreview = ({ html, title }: { html: string; title: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="border rounded-lg overflow-hidden bg-card" style={{ height: '600px' }}>
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          sandbox="allow-same-origin"
          title={title}
        />
      </div>
    </div>
  );
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    originalHtml: string;
    personalizedHtml: string;
    changes: Change[];
    landingPageUrl: string;
    screenshot?: string;
  } | null;

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No results found</h2>
          <p className="text-muted-foreground">Generate a personalized page first.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([state.personalizedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'personalized-landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
                Troopod
              </span>
            </div>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" /> Download HTML
          </Button>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* URL */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Personalized version of</p>
          <p className="font-medium truncate">{state.landingPageUrl}</p>
        </div>

        {/* Side by Side */}
        <div className="grid lg:grid-cols-2 gap-6">
          <HtmlPreview html={state.originalHtml} title="📄 Original Page" />
          <HtmlPreview html={state.personalizedHtml} title="✨ Personalized Page" />
        </div>

        {/* Changes Summary */}
        {state.changes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Changes Made ({state.changes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.changes.map((change, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{change.element}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Original</p>
                        <p className="bg-destructive/10 text-destructive rounded px-2 py-1 line-through">
                          {change.original}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Modified</p>
                        <p className="bg-accent/10 text-accent-foreground rounded px-2 py-1 font-medium">
                          {change.modified}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      💡 {change.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
