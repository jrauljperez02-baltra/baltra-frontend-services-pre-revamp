import { useAuthenticator } from '@aws-amplify/ui-react';

const SignUpFooter = () => {
    const { toSignIn } = useAuthenticator();

    return (
        <div className="mt-6 text-center text-sm text-gray-600 space-y-3">
            <div>
                ¿Ya tienes una cuenta?{' '}
                <button
                    onClick={toSignIn}
                    className="text-[#0A2A5B] hover:underline font-medium mb-3"
                >
                    Iniciar sesión
                </button>
            </div>
        </div>
    );
};

export default SignUpFooter;
