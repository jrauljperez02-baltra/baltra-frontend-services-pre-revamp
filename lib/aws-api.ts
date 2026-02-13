// lib/aws-api.ts
import { AWS_API_GATEWAY_URL } from '@/config/env';

class AccountSwitchService {
    private idToken: string | null;

    constructor(idToken: string) {
        this.idToken = idToken;
    }

    async switchCompany(targetCompanyId: number): Promise<any> {
        try {
            const response = await fetch(
                `${AWS_API_GATEWAY_URL}/user-company`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.idToken}`,
                    },
                    body: JSON.stringify({
                        target_company_id: targetCompanyId,
                    }),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error switching company:', error);
            throw error;
        }
    }
}

export default AccountSwitchService;
