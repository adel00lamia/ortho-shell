import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useDiscussions,
  useAddDiscussion,
  useDeleteDiscussion,
  useToggleReaction,
  type Discussion,
  type ReactionSummary,
} from '@/hooks/useDiscussions';
import { MessageSquare, Send, Trash2, Reply, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface DiscussionThreadProps {
  moduleId?: string;
  planId?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🎉', '💡', '👀', '🔥'];

function ReactionBar({ reactions, discussionId }: { reactions: ReactionSummary[]; discussionId: string }) {
  const toggleReaction = useToggleReaction();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction.mutate({ discussionId, emoji: r.emoji })}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
            r.reacted
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-transparent hover:border-border'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-muted hover:bg-muted/80 transition-colors"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-1.5 bg-popover border rounded-lg shadow-lg z-10">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  toggleReaction.mutate({ discussionId, emoji });
                  setShowPicker(false);
                }}
                className="hover:bg-muted p-1 rounded transition-colors text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  isReply = false,
}: {
  comment: Discussion;
  onReply: (id: string) => void;
  isReply?: boolean;
}) {
  const { user } = useAuth();
  const deleteDiscussion = useDeleteDiscussion();
  const { language } = useLanguage();
  const fr = language === 'fr';
  const isOwn = user?.id === comment.user_id;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return fr ? 'à l\'instant' : 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex items-start gap-3 py-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.user_name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
            {isOwn && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">{fr ? 'Vous' : 'You'}</Badge>
            )}
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <ReactionBar reactions={comment.reactions || []} discussionId={comment.id} />
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Reply className="h-3 w-3" /> {fr ? 'Répondre' : 'Reply'}
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => {
                  deleteDiscussion.mutate(comment.id);
                  toast.success(fr ? 'Commentaire supprimé' : 'Comment deleted');
                }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map(reply => (
        <CommentCard key={reply.id} comment={reply} onReply={onReply} isReply />
      ))}
    </div>
  );
}

export function DiscussionThread({ moduleId, planId }: DiscussionThreadProps) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { data: discussions = [], isLoading } = useDiscussions(moduleId, planId);
  const addDiscussion = useAddDiscussion();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addDiscussion.mutate(
      { module_id: moduleId, plan_id: planId, content: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment('');
          toast.success(fr ? 'Commentaire ajouté' : 'Comment posted');
        },
      }
    );
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    addDiscussion.mutate(
      { module_id: moduleId, plan_id: planId, parent_id: parentId, content: replyContent.trim() },
      {
        onSuccess: () => {
          setReplyContent('');
          setReplyTo(null);
          toast.success(fr ? 'Réponse ajoutée' : 'Reply posted');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {fr ? 'Discussion' : 'Discussion'}
          {discussions.length > 0 && (
            <Badge variant="secondary" className="text-xs">{discussions.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* New comment input */}
        <div className="flex gap-2 mb-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={fr ? 'Partagez une idée, une question...' : 'Share an idea, question...'}
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || addDiscussion.isPending}
            size="sm"
            className="self-end"
          >
            {addDiscussion.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && discussions.length === 0 && (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {fr ? 'Aucune discussion. Soyez le premier à commenter !' : 'No discussions yet. Be the first to comment!'}
            </p>
          </div>
        )}

        {/* Comments */}
        <div className="divide-y">
          {discussions.map(d => (
            <div key={d.id}>
              <CommentCard
                comment={d}
                onReply={(id) => {
                  setReplyTo(replyTo === id ? null : id);
                  setReplyContent('');
                }}
              />
              {/* Reply input */}
              {replyTo === d.id && (
                <div className="ml-12 mb-3 flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={fr ? 'Votre réponse...' : 'Your reply...'}
                    className="min-h-[40px] text-sm resize-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(d.id);
                      if (e.key === 'Escape') setReplyTo(null);
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={() => handleReply(d.id)} disabled={!replyContent.trim()}>
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)} className="text-xs px-2">
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
