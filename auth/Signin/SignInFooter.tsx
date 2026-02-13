import { useAuthenticator } from '@aws-amplify/ui-react';

const SignInFooter = () => {
    const { toSignUp, toForgotPassword } = useAuthenticator();

    return (
        <div className="mt-6 text-center text-sm text-gray-600 space-y-3">
            <div>
                <button
                    onClick={toForgotPassword}
                    className="text-[#0A2A5B] hover:underline font-medium"
                >
                    ¿Olvidaste tu contraseña?
                </button>
            </div>

            <div>
                ¿Aún no tienes una cuenta?{' '}
                <button
                    onClick={toSignUp}
                    className="text-[#0A2A5B] hover:underline font-medium mb-3"
                >
                    Crear cuenta
                </button>
            </div>
        </div>
    );
};

export default SignInFooter;
