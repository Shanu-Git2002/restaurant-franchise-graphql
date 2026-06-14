import { gql } from '@apollo/client';

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id email firstName lastName fullName phone avatarUrl role isActive isEmailVerified lastLoginAt createdAt updatedAt
  }
`;

export const LOGIN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { ...UserFields }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { ...UserFields }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout { logout { success message } }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) { success message }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) { success message }
  }
`;

export const ME_QUERY = gql`
  ${USER_FRAGMENT}
  query Me { me { ...UserFields } }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { ...UserFields }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) { success message }
  }
`;
