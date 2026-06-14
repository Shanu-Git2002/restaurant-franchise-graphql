import { gql } from '@apollo/client';

export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats($franchiseId: ID) {
    dashboardStats(franchiseId: $franchiseId) {
      totalOutlets activeOutlets totalEmployees totalReviews
      averageRating totalRevenue revenueGrowth reviewGrowth reputationScore
    }
  }
`;

export const OUTLET_PERFORMANCE_QUERY = gql`
  query OutletPerformance($franchiseId: ID, $limit: Int) {
    outletPerformance(franchiseId: $franchiseId, limit: $limit) {
      rank revenue reviewCount averageRating reputationScore employeeCount
      outlet { id name city status }
    }
  }
`;

export const REVENUE_ANALYTICS_QUERY = gql`
  query RevenueAnalytics($franchiseId: ID, $startDate: DateTime, $endDate: DateTime, $granularity: String) {
    revenueAnalytics(franchiseId: $franchiseId, startDate: $startDate, endDate: $endDate, granularity: $granularity) {
      totalRevenue previousRevenue growthPercentage
      dailyData { date amount }
      byOutlet { revenue percentage outlet { id name city } }
    }
  }
`;

export const REPUTATION_OVERVIEW_QUERY = gql`
  query ReputationOverview($franchiseId: ID) {
    reputationOverview(franchiseId: $franchiseId) {
      outletId outletName score trend totalReviews averageRating
    }
  }
`;

export const DASHBOARD_UPDATED_SUBSCRIPTION = gql`
  subscription DashboardUpdated($franchiseId: ID!) {
    dashboardUpdated(franchiseId: $franchiseId) {
      totalOutlets activeOutlets totalEmployees totalReviews
      averageRating totalRevenue revenueGrowth reviewGrowth reputationScore
    }
  }
`;
