import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { REVIEWS_QUERY, REVIEW_STATISTICS_QUERY, RESPOND_TO_REVIEW_MUTATION } from '../api/review.graphql';
import { formatDate, formatRelativeTime, getSentimentColor, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { Review, ReviewSource, Sentiment } from '@/types';

const sourceIcons: Record<string, string> = {
  GOOGLE: '🔍',
  WHATSAPP: '📱',
  INTERNAL: '🏠',
  FACEBOOK: '📘',
  ZOMATO: '🍕',
  SWIGGY: '🛵',
};

const sentimentIcons = {
  POSITIVE: <ThumbsUp className="h-4 w-4 text-green-600" />,
  NEUTRAL: <Minus className="h-4 w-4 text-yellow-600" />,
  NEGATIVE: <ThumbsDown className="h-4 w-4 text-red-600" />,
};

export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data, loading, refetch } = useQuery(REVIEWS_QUERY, {
    variables: {
      filter: {
        ...(sourceFilter && { source: sourceFilter as ReviewSource }),
        ...(sentimentFilter && { sentiment: sentimentFilter as Sentiment }),
      },
      pagination: { page, limit: 10 },
      sort: { field: 'reviewDate', direction: 'desc' },
    },
  });

  const { data: statsData } = useQuery(REVIEW_STATISTICS_QUERY);
  const stats = statsData?.reviewStatistics;

  const [respondToReview, { loading: responding }] = useMutation(RESPOND_TO_REVIEW_MUTATION, {
    onCompleted: () => {
      toast({ title: 'Response submitted!' });
      setRespondingTo(null);
      setResponseText('');
      refetch();
    },
    onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const reviews: Review[] = data?.reviews?.data ?? [];
  const pagination = data?.reviews;

  const handleRespond = () => {
    if (!respondingTo || !responseText.trim()) return;
    respondToReview({ variables: { input: { reviewId: respondingTo.id, response: responseText } } });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Monitor and respond to customer feedback</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.totalReviews, color: 'blue' },
            { label: 'Avg Rating', value: stats.averageRating.toFixed(1), color: 'yellow' },
            { label: 'Positive', value: stats.positiveCount, color: 'green' },
            { label: 'Negative', value: stats.negativeCount, color: 'red' },
            { label: 'Response Rate', value: `${stats.responseRate.toFixed(0)}%`, color: 'purple' },
          ].map(({ label, value }) => (
            <Card key={label} className="text-center">
              <CardContent className="p-3">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sources</SelectItem>
            {['GOOGLE', 'WHATSAPP', 'INTERNAL', 'FACEBOOK', 'ZOMATO', 'SWIGGY'].map(s => (
              <SelectItem key={s} value={s}>{sourceIcons[s]} {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Sentiments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sentiments</SelectItem>
            <SelectItem value="POSITIVE">👍 Positive</SelectItem>
            <SelectItem value="NEUTRAL">➖ Neutral</SelectItem>
            <SelectItem value="NEGATIVE">👎 Negative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg">{sourceIcons[review.source]}</span>
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm font-medium text-muted-foreground">{review.rating.toFixed(1)}</span>
                      <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', getSentimentColor(review.sentiment))}>
                        {sentimentIcons[review.sentiment]}
                        {review.sentiment}
                      </div>
                      {!review.isResponded && (
                        <Badge variant="warning">Needs Response</Badge>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-sm">{review.authorName}</p>
                      <p className="text-xs text-muted-foreground">{review.outlet.name} • {formatDate(review.reviewDate)}</p>
                    </div>

                    {review.content && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                    )}

                    {review.isResponded && review.response && (
                      <div className="bg-blue-50 border-l-2 border-blue-400 p-3 rounded-r-md">
                        <p className="text-xs font-medium text-blue-700 mb-1">Your Response</p>
                        <p className="text-sm text-blue-900">{review.response}</p>
                        {review.respondedAt && (
                          <p className="text-xs text-blue-600 mt-1">{formatRelativeTime(review.respondedAt)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!review.isResponded && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRespondingTo(review)}
                      className="shrink-0"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Respond
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!pagination.hasPreviousPage} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={() => { setRespondingTo(null); setResponseText(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          {respondingTo && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p className="font-medium">{respondingTo.authorName} — {respondingTo.rating}/5 ⭐</p>
                <p className="text-muted-foreground mt-1">{respondingTo.content ?? 'No content'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Response</label>
                <textarea
                  className="w-full border rounded-md p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Write a professional, helpful response..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRespondingTo(null)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleRespond}
                  loading={responding}
                  disabled={!responseText.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Submit Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
