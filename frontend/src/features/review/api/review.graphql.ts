import { gql } from '@apollo/client';

export const REVIEW_FRAGMENT = gql`
  fragment ReviewFields on Review {
    id source rating content authorName authorEmail authorPhoto
    sentiment isResponded response respondedAt reviewDate tags isVerified helpfulCount createdAt
    outlet { id name city }
  }
`;

export const REVIEWS_QUERY = gql`
  ${REVIEW_FRAGMENT}
  query Reviews($filter: ReviewFilterInput, $sort: SortInput, $pagination: PaginationInput) {
    reviews(filter: $filter, sort: $sort, pagination: $pagination) {
      data { ...ReviewFields }
      total page limit hasNextPage hasPreviousPage
    }
  }
`;

export const REVIEW_STATISTICS_QUERY = gql`
  query ReviewStatistics($outletId: ID, $startDate: DateTime, $endDate: DateTime) {
    reviewStatistics(outletId: $outletId, startDate: $startDate, endDate: $endDate) {
      totalReviews averageRating positiveCount neutralCount negativeCount responseRate
      ratingDistribution { rating count percentage }
      sourceDistribution { source count percentage averageRating }
      trendData { date count averageRating }
    }
  }
`;

export const RESPOND_TO_REVIEW_MUTATION = gql`
  ${REVIEW_FRAGMENT}
  mutation RespondToReview($input: RespondToReviewInput!) {
    respondToReview(input: $input) { ...ReviewFields }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  ${REVIEW_FRAGMENT}
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) { ...ReviewFields }
  }
`;

export const DELETE_REVIEW_MUTATION = gql`
  mutation DeleteReview($id: ID!) { deleteReview(id: $id) { success message } }
`;

export const IMPORT_REVIEWS_MUTATION = gql`
  mutation ImportReviews($outletId: ID!, $source: ReviewSource!) {
    importReviews(outletId: $outletId, source: $source) { success message }
  }
`;

export const NEW_REVIEW_SUBSCRIPTION = gql`
  ${REVIEW_FRAGMENT}
  subscription NewReview($outletId: ID!) { newReview(outletId: $outletId) { ...ReviewFields } }
`;
