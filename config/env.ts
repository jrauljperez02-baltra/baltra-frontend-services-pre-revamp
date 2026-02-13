export const AWS_COGNITO_USER_POOL_CLIENT_ID = process.env
    .NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID as string;
export const AWS_COGNITO_USER_POOL_ID = process.env
    .NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID as string;
export const AWS_COGNITO_REGION = process.env
    .NEXT_PUBLIC_AWS_COGNITO_REGION as string;
export const AWS_COGNITO_DOMAIN = process.env
    .NEXT_PUBLIC_AWS_COGNITO_DOMAIN as string;
export const AWS_API_GATEWAY_URL = process.env
    .NEXT_PUBLIC_AWS_API_GATEWAY_URL as string;
export const GOOGLE_MAPS_API_KEY = process.env
    .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;
export const BACKEND_BASE_URL = process.env
    .NEXT_PUBLIC_API_URL as string;

export const CLOUDWATCH_REGION =
    (process.env.NEXT_PUBLIC_CLOUDWATCH_REGION as string) ||
    AWS_COGNITO_REGION ||
    'us-east-2';
