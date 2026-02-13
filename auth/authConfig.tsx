import {
    AWS_COGNITO_USER_POOL_ID,
    AWS_COGNITO_USER_POOL_CLIENT_ID,
    AWS_COGNITO_DOMAIN,
} from '@/config/env';
import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolClientId: AWS_COGNITO_USER_POOL_CLIENT_ID,
            userPoolId: AWS_COGNITO_USER_POOL_ID,
            loginWith: {
                oauth: {
                    domain: AWS_COGNITO_DOMAIN,
                    scopes: ['openid', 'email'],
                    redirectSignIn: [],
                    redirectSignOut: [],
                    responseType: 'token',
                },
            },
        },
    },
});

const formFields = {
    signIn: {
        username: {
            label: 'Correo electrónico',
            placeholder: 'Ingresa tu correo electrónico',
        },
        password: {
            label: 'Contraseña',
            placeholder: 'Ingresa tu contraseña',
            hideShowPassword: true,
        },
    },
    signUp: {
        username: {
            label: 'Correo electrónico',
            placeholder: 'Ingresa tu correo electrónico',
        },
        password: {
            label: 'Contraseña',
            placeholder: 'Crea una contraseña',
            hideShowPassword: true,
        },
        confirm_password: {
            label: 'Confirmar contraseña',
            placeholder: 'Repite tu contraseña',
            hideShowPassword: true,
        },
    },
    forceNewPassword: {
        password: {
            label: 'Nueva contraseña obligatoria',
            placeholder: 'Ingresa tu nueva contraseña',
            hideShowPassword: true,
        },
    },
    forgotPassword: {
        username: {
            label: 'Correo electrónico',
            placeholder: 'Ingresa tu correo electrónico',
        },
    },
    confirmResetPassword: {
        confirmation_code: {
            label: 'Código de verificación',
            placeholder: 'Ingresa el código enviado a tu correo',
        },
        password: {
            label: 'Nueva contraseña',
            placeholder: 'Crea una nueva contraseña',
            hideShowPassword: true,
        },
        confirm_password: {
            label: 'Confirmar nueva contraseña',
            placeholder: 'Repite la nueva contraseña',
            hideShowPassword: true,
        },
    },
    confirmSignIn: {
        confirmation_code: {
            label: 'Código de confirmación',
            placeholder: 'Ingresa el código recibido',
        },
    },
    setupTotp: {
        confirmation_code: {
            label: 'Código de verificación TOTP',
            placeholder: 'Ingresa el código de tu app de autenticación',
        },
    },
    setupEmail: {
        email: {
            label: 'Correo electrónico',
            placeholder: 'Ingresa tu correo electrónico',
        },
    },
};

export { formFields };
