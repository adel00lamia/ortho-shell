import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, MessageCircle, Plus, Send, Search, Tag, Loader2,
  FileText, Scale, Brain, Layers, Trash2, ExternalLink, Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { value: "policies", label: "Policies & SOPs", labelFr: "Politiques & SOPs", icon: FileText },
  { value: "legal", label: "Legal & Regulatory", labelFr: "Juridique & Réglementaire", icon: Scale },
  { value: "skills", label: "Skills Frameworks", labelFr: "Référentiels de compétences", icon: Brain },
  { value: "trends", label: "Trends & Articles", labelFr: "Tendances & Articles", icon: Layers },
  { value: "general", label: "General", labelFr: "Général", icon: BookOpen },
];

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  tags: string[];
  source_url: string | null;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string }[];
}

const DEMO_ARTICLES: Article[] = [
  {
    id: "demo-1", title: "Code du Travail Marocain - Congés Annuels",
    content: "Selon l'article 231 du Code du Travail marocain, tout salarié a droit à un congé annuel payé après 6 mois de service continu. La durée est de 1,5 jour ouvrable par mois de service, soit 18 jours ouvrables par an. Après 5 ans d'ancienneté, un jour supplémentaire est ajouté par période de 5 ans.",
    summary: "Réglementation des congés annuels au Maroc", category: "legal", tags: ["congés", "droit du travail", "maroc"], source_url: null, created_at: new Date().toISOString(),
  },
  {
    id: "demo-2", title: "Competency Framework - Digital Skills 2025",
    content: "Digital competency framework for modern organizations: 1) Data Literacy (Level 1-5): Understanding data collection, analysis, and visualization. 2) AI & Automation: Basics of machine learning, prompt engineering, workflow automation. 3) Cybersecurity Awareness: Password management, phishing detection, data protection (RGPD/CNDP compliance). 4) Cloud Collaboration: Proficiency with cloud-based tools, async communication, project management platforms.",
    summary: "Digital skills competency framework", category: "skills", tags: ["digital", "competencies", "2025"], source_url: null, created_at: new Date().toISOString(),
  },
  {
    id: "demo-3", title: "Performance Management Best Practices",
    content: "Modern performance management moves beyond annual reviews: 1) Continuous feedback loops with monthly check-ins. 2) OKR-based goal setting aligned to company strategy. 3) 360-degree feedback from peers, reports, and managers. 4) Skills-based assessments linked to career development paths. 5) Data-driven evaluation using KPIs and competency scores. Research shows that companies using continuous performance management see 14.9% lower turnover rates.",
    summary: "Best practices for modern performance management", category: "trends", tags: ["performance", "feedback", "OKR"], source_url: null, created_at: new Date().toISOString(),
  },
  {
    id: "demo-4", title: "Politique d'Onboarding - Procédure Standard",
    content: "Processus d'intégration des nouveaux collaborateurs: Semaine 1: Accueil administratif (CNSS, mutuelle, badge), présentation de l'équipe, formation aux outils. Semaine 2-4: Programme de mentorat, objectifs de période d'essai, première évaluation informelle. Mois 2-3: Montée en compétences, formation technique spécifique au poste, revue mi-période d'essai. Checklist obligatoire: contrat signé, fiche de poste remise, accès IT configurés, manager mentor assigné.",
    summary: "Procédure standard d'onboarding", category: "policies", tags: ["onboarding", "intégration", "procédure"], source_url: null, created_at: new Date().toISOString(),
  },
];

export default function HRKnowledgeBase() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // New article form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newTags, setNewTags] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("company_id").eq("id", user.id).single()
        .then(({ data }) => { if (data?.company_id) setCompanyId(data.company_id); });
    }
  }, [user]);

  // Fetch articles
  const { data: dbArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ["hr-knowledge-articles", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase as any)
        .from("hr_knowledge_articles")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Article[];
    },
    enabled: !!companyId,
  });

  const articles = (dbArticles && dbArticles.length > 0) ? dbArticles : DEMO_ARTICLES;

  // Add article mutation
  const addArticle = useMutation({
    mutationFn: async () => {
      if (!companyId || !user) throw new Error("Missing context");
      const { error } = await (supabase as any).from("hr_knowledge_articles").insert({
        company_id: companyId,
        created_by: user.id,
        title: newTitle,
        content: newContent,
        category: newCategory,
        tags: newTags.split(",").map((t: string) => t.trim()).filter(Boolean),
        source_url: newSourceUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-knowledge-articles"] });
      setShowAddDialog(false);
      setNewTitle(""); setNewContent(""); setNewCategory("general"); setNewTags(""); setNewSourceUrl("");
      toast.success(language === "fr" ? "Article ajouté" : "Article added");
    },
    onError: () => toast.error(language === "fr" ? "Erreur lors de l'ajout" : "Failed to add article"),
  });

  // Delete article
  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("hr_knowledge_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-knowledge-articles"] });
      toast.success(language === "fr" ? "Article supprimé" : "Article deleted");
    },
  });

  // Chat with AI
  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("hr-knowledge-chat", {
        body: { question: userMsg.content, companyId: companyId || "demo", language },
      });
      if (error) throw error;
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: language === "fr" ? "Désolé, une erreur est survenue." : "Sorry, an error occurred." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Filter articles
  const filteredArticles = articles.filter((a) => {
    const matchSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || a.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const fr = language === "fr";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{fr ? "Base de Connaissances RH" : "HR Knowledge Base"}</h1>
              <p className="text-muted-foreground">
                {fr ? "Votre assistant IA alimenté par vos propres contenus RH" : "Your AI assistant powered by your own HR content"}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {fr ? "Assistant IA" : "AI Assistant"}
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {fr ? "Bibliothèque" : "Knowledge Library"}
              <Badge variant="secondary" className="text-xs">{articles.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* AI Chat Tab */}
          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {fr ? "Assistant RH Intelligent" : "Smart HR Assistant"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {fr
                    ? `Posez une question — l'IA cherche dans vos ${articles.length} articles pour répondre`
                    : `Ask a question — AI searches your ${articles.length} articles to answer`}
                </p>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Brain className="h-12 w-12 mb-4 opacity-30" />
                    <p className="font-medium">{fr ? "Posez votre première question" : "Ask your first question"}</p>
                    <p className="text-sm mt-1 max-w-md">
                      {fr
                        ? "Ex: Quels sont les droits de congé selon le Code du Travail ?"
                        : "E.g., What are the leave entitlements under labor law?"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 max-w-lg justify-center">
                      {[
                        fr ? "Quelles compétences digitales développer ?" : "What digital skills should we develop?",
                        fr ? "Processus d'onboarding recommandé ?" : "Recommended onboarding process?",
                        fr ? "Comment améliorer la rétention ?" : "How to improve retention?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setChatInput(q); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-xs opacity-70 mb-1">{fr ? "Sources:" : "Sources:"}</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((s, j) => (
                                <Badge key={j} variant="outline" className="text-[10px]">
                                  {s.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isChatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {fr ? "Recherche dans la base..." : "Searching knowledge base..."}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </CardContent>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={fr ? "Posez votre question RH..." : "Ask your HR question..."}
                    disabled={isChatLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!chatInput.trim() || isChatLoading} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={fr ? "Rechercher..." : "Search articles..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{fr ? "Toutes les catégories" : "All categories"}</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {fr ? c.labelFr : c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {fr ? "Ajouter un article" : "Add Article"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{fr ? "Ajouter à la base de connaissances" : "Add to Knowledge Base"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium">{fr ? "Titre" : "Title"} *</label>
                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={fr ? "Titre de l'article" : "Article title"} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{fr ? "Catégorie" : "Category"}</label>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{fr ? c.labelFr : c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">{fr ? "Contenu" : "Content"} *</label>
                        <Textarea
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder={fr ? "Collez votre article, politique ou contenu ici..." : "Paste your article, policy, or content here..."}
                          rows={12}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{fr ? "Tags (séparés par des virgules)" : "Tags (comma-separated)"}</label>
                        <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="e.g., onboarding, policy, compliance" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{fr ? "URL source (optionnel)" : "Source URL (optional)"}</label>
                        <Input value={newSourceUrl} onChange={(e) => setNewSourceUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <Button
                        onClick={() => addArticle.mutate()}
                        disabled={!newTitle || !newContent || addArticle.isPending}
                        className="w-full"
                      >
                        {addArticle.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {fr ? "Ajouter l'article" : "Add Article"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Category stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const count = articles.filter((a) => a.category === cat.value).length;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(selectedCategory === cat.value ? "all" : cat.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                        selectedCategory === cat.value ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{fr ? cat.labelFr : cat.label}</p>
                        <p className="text-lg font-bold tabular-nums">{count}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Articles list */}
              {articlesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium">{fr ? "Aucun article trouvé" : "No articles found"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fr ? "Ajoutez votre premier article pour alimenter l'IA" : "Add your first article to power the AI"}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredArticles.map((article, idx) => {
                    const cat = CATEGORIES.find((c) => c.value === article.category);
                    const CatIcon = cat?.icon || BookOpen;
                    return (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CatIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <Badge variant="outline" className="text-xs">
                                    {fr ? cat?.labelFr : cat?.label}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-sm">{article.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {article.content.substring(0, 200)}...
                                </p>
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {article.tags.map((tag) => (
                                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        <Tag className="h-2.5 w-2.5 inline mr-0.5" />{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {article.source_url && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={article.source_url} target="_blank" rel="noopener">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                                {!article.id.startsWith("demo") && (
                                  <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteArticle.mutate(article.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
