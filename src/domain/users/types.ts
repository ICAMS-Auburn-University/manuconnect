export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  accountType: string;
  companyName: string;
  profilePicture?: string;
  user_metadata?: {
    display_name?: string;
    account_type?: string;
    company_name?: string;
  };
}
