import { useAuthenticator } from '@aws-amplify/ui-react';

const SignUpFormFields = () => {
    const { validationErrors } = useAuthenticator();

    return (
        <>
            <style>{`.amplify-button { display: none; }`}</style>

            <div>
                <label htmlFor="email">Correo electrónico</label>
                <input
                    name="username"
                    type="email"
                    placeholder="nombre@correo.com"
                />
                {validationErrors.username && (
                    <span>{validationErrors.username}</span>
                )}
            </div>

            <div>
                <label htmlFor="password">Contraseña</label>
                <input
                    name="password"
                    type="password"
                    placeholder="Crea una contraseña"
                />
                {validationErrors.password && (
                    <span>{validationErrors.password}</span>
                )}
            </div>

            <div>
                <label htmlFor="confirm_password">Confirmar contraseña</label>
                <input
                    name="confirm_password"
                    type="password"
                    placeholder="Confirma tu contraseña"
                />
                {validationErrors.confirm_password && (
                    <span>{validationErrors.confirm_password}</span>
                )}
            </div>

            <div>
                Al registrarte, aceptas nuestros{' '}
                <a href="/terms">Términos de servicio</a> y nuestra{' '}
                <a href="/privacy">Política de privacidad</a>.
            </div>

            <div>
                <button type="submit">Crear cuenta</button>
            </div>
        </>
    );
};

export default SignUpFormFields;
