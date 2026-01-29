import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  MoreHorizontal,
  Trash2,
  Edit2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  user_name?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface PlanCommentsProps {
  planId?: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment?: (content: string, parentId?: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export const PlanComments = ({
  planId,
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading = false,
}: PlanCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !onAddComment) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !onAddComment) return;
    setIsSubmitting(true);
    try {
      await onAddComment(replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !onEditComment) return;
    setIsSubmitting(true);
    try {
      await onEditComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDeleteComment(commentId);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(comment.user_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.user_name || 'User'}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </span>
              {comment.updated_at !== comment.created_at && (
                <Badge variant="outline" className="text-xs">Edited</Badge>
              )}
            </div>
            {currentUserId === comment.user_id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {editingId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleEditComment(comment.id)}
                  disabled={isSubmitting}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setEditContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{comment.content}</p>
          )}

          {!isReply && editingId !== comment.id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-11 mb-3 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleSubmitReply(comment.id)}
              disabled={isSubmitting || !replyContent.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              Reply
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {getReplies(comment.id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Team Comments
          {comments.length > 0 && (
            <Badge variant="secondary">{comments.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Discuss this training plan with your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-1 divide-y">
            {topLevelComments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
