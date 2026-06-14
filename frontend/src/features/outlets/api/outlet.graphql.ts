import { gql } from '@apollo/client';

export const OUTLET_FRAGMENT = gql`
  fragment OutletFields on Outlet {
    id name address city state country postalCode phone email status
    employeeCount totalReviews averageRating reputationScore totalRevenue
    createdAt updatedAt
    franchise { id name slug logoUrl }
    manager { id firstName lastName email avatarUrl }
  }
`;

export const OUTLETS_QUERY = gql`
  ${OUTLET_FRAGMENT}
  query Outlets($filter: OutletFilterInput, $sort: SortInput, $pagination: PaginationInput) {
    outlets(filter: $filter, sort: $sort, pagination: $pagination) {
      data { ...OutletFields }
      total page limit hasNextPage hasPreviousPage
    }
  }
`;

export const OUTLET_QUERY = gql`
  ${OUTLET_FRAGMENT}
  query Outlet($id: ID!) {
    outlet(id: $id) {
      ...OutletFields
      openingHours
      employees {
        id position
        user { id firstName lastName email role avatarUrl }
      }
    }
  }
`;

export const FRANCHISE_QUERY = gql`
  query Franchise {
    franchise {
      id name slug description logoUrl website phone email address outletCount createdAt
      owner { id firstName lastName email }
      outlets { id name city status averageRating totalReviews }
    }
  }
`;

export const CREATE_OUTLET_MUTATION = gql`
  ${OUTLET_FRAGMENT}
  mutation CreateOutlet($input: CreateOutletInput!) {
    createOutlet(input: $input) { ...OutletFields }
  }
`;

export const UPDATE_OUTLET_MUTATION = gql`
  ${OUTLET_FRAGMENT}
  mutation UpdateOutlet($id: ID!, $input: UpdateOutletInput!) {
    updateOutlet(id: $id, input: $input) { ...OutletFields }
  }
`;

export const DELETE_OUTLET_MUTATION = gql`
  mutation DeleteOutlet($id: ID!) { deleteOutlet(id: $id) { success message } }
`;

export const ASSIGN_MANAGER_MUTATION = gql`
  ${OUTLET_FRAGMENT}
  mutation AssignManager($outletId: ID!, $managerId: ID!) {
    assignManager(outletId: $outletId, managerId: $managerId) { ...OutletFields }
  }
`;

export const CREATE_FRANCHISE_MUTATION = gql`
  mutation CreateFranchise($input: CreateFranchiseInput!) {
    createFranchise(input: $input) {
      id name slug description logoUrl outletCount createdAt
    }
  }
`;

export const OUTLET_STATUS_SUBSCRIPTION = gql`
  ${OUTLET_FRAGMENT}
  subscription OutletStatusChanged($franchiseId: ID!) {
    outletStatusChanged(franchiseId: $franchiseId) { ...OutletFields }
  }
`;
