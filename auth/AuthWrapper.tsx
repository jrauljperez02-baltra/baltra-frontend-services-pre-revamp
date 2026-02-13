'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, updateUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import SignInFooter from '@/auth/Signin/SignInFooter';
import SignUpFooter from '@/auth/Signup/SignUpFooter';
import Header from '@/auth/Header/Header';

import { formFields } from './authConfig';
import '@/styles/AuthComponent.css';

import { I18n } from 'aws-amplify/utils';
import { translations } from '@aws-amplify/ui-react';

I18n.putVocabularies(translations);
I18n.setLanguage('es');

I18n.putVocabularies({
    es: {
        'Sign In': 'Inicia sesión',
        'Sign in to your account': 'Inicia sesión en tu cuenta',
        'Forgot your password?': '¿Olvidaste tu contraseña?',
        'Reset Password': 'Restablecer contraseña',
        'Back to Sign In': 'Volver a iniciar sesión',
        'Create a new account': 'Crea una nueva cuenta',
        'Sign Up': 'Regístrate',
        'Have an account? Sign In': '¿Ya tienes una cuenta? Inicia sesión',
        'Confirm Sign Up': 'Confirma tu registro',
        'Confirm Sign In': 'Confirma tu inicio de sesión',
        'Confirmation Code': 'Código de verificación',
        'Resend Code': 'Reenviar código',
        Confirm: 'Confirmar',
        'Forgot Password': '¿Olvidaste tu contraseña?',
        'Send Code': 'Enviar código',
        Submit: 'Continuar',
        'Confirm Reset Password': 'Confirma el restablecimiento de contraseña',
        'Enter your code': 'Ingresa tu código',
        'Enter your password': 'Ingresa tu contraseña',
        'New Password': 'Nueva contraseña',
        'Confirm Password': 'Confirmar contraseña',
        'Select MFA Type': 'Selecciona el tipo de MFA',
        'Setup TOTP': 'Configura TOTP',
        'Setup Email': 'Configura MFA por correo',
        'Enter Information:': 'Ingresa la información:',
        Username: 'Usuario',
        Password: 'Contraseña',
        Email: 'Correo electrónico',
        'Phone Number': 'Número de teléfono',
        'Given Name': 'Nombre',
        'Family Name': 'Apellido',
        'Sign Out': 'Cerrar sesión',
        'Change Password': 'Cambiar contraseña',
        'Loading...': 'Cargando…',
    },
});

type Props = {
    children: React.ReactNode;
};

const AuthProvider: React.FC<Props> = ({ children }) => {
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    const components = useMemo(
        () => ({
            Header,
            Tabs: () => null,
            SignIn: { Footer: SignInFooter },
            SignUp: { Footer: SignUpFooter },
        }),
        []
    );

    const checkToken = async () => {
        try {
            const session = await fetchAuthSession();
            const idToken = session?.tokens?.idToken?.toString();
            const hasValidToken = !!idToken;
            setHasToken(hasValidToken);
            return hasValidToken;
        } catch {
            setHasToken(false);
            return false;
        }
    };

    const writeLastLogin = async () => {
        try {
            await updateUserAttributes({
                userAttributes: { 'custom:last_login': new Date().toISOString() },
            });
        } catch { }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const hasValidToken = await checkToken();
            if (hasValidToken) {
                await writeLastLogin();
            }
        };

        initializeAuth();
        
        const unsubscribe = Hub.listen('auth', async ({ payload }) => {
            if (payload?.event === 'signedIn') {
                await writeLastLogin();
                await checkToken();
            }
            if (payload?.event === 'signedOut') {
                await checkToken();
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    if (hasToken === null) {
        return <div>Cargando…</div>;
    }

    return (
        <div className="auth-container">
            <Authenticator formFields={formFields} components={components}>
                {children}
            </Authenticator>
        </div>
    );
};

export default AuthProvider;
