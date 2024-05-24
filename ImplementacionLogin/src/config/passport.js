/* import passport from "passport"
import passportLocal from "passport-local"
import userModel from "../models/modelsMongo/users.model.js"
import { createHash, isValidPassword } from "../../utils.js"
import GitHubStrategy from 'passport-github2'
import jwtStrategy from 'passport-jwt'
import { PRIVATE_KEY } from '../../utils.js'

const JwtStrategy = jwtStrategy.Strategy
const ExtractJWT = jwtStrategy.ExtractJwt

const localStrategy = passportLocal.Strategy

const initializePassport = () => {

    passport.use('jwt', new JwtStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
            secretOrKey: PRIVATE_KEY
        },
        async (jwt_payload, done) => {
            console.log("entrando a passport strategy con JWT")
            try {
                console.log("jwt obtenido del payload")
                console.log(jwt_payload)
                return done(null,jwt_payload.user)

            } catch (error) {
                console.log(error)
                return done(error)
            }
        }
    ))

    passport.use('github', new GitHubStrategy(
        {
            clientID: 'Iv1.b42560ee6348422e',
            clientSecret: '5edb99fd472cfd85d1e0699c7ec137d422d4c3ae',
            callbackUrl: 'http://localhost:8080/api/githubcallback'
        }, async (accessToken, refreshToken, profile, done) => {

            console.log("perfil obtenido de github en passport js")
            console.log(profile)
            console.log(profile._json.email)
            try {
                const user = await userModel.findOne({ email: profile._json.email })
                console.log('usuario encontrado para login ')
                console.log(user)

                if (!user) {

                    let newUser = {
                        firstName: profile._json.name,
                        lastName: '',
                        email: profile._json.email,
                        password: ''
                    }

                    const result = await userModel.create(newUser)
                    return done(null, result)
                } else {
                    console.log('en el else de passport')
                    console.log(user)
                    return done(null, user)
                }
            } catch (error) {
                return done(error)
            }

        }
    ))

    passport.use('register', new localStrategy(
        { passReqToCallback: true, usernameField: "email" },
        async (req, username, password, done) => {
            try {
                const { firstName, lastName, email } = req.body
                const exist = await userModel.findOne({ email })
                
                if (exist) {
                    return done(null, false,{ message: 'El correo electrónico ya está registrado' })
                }

                const newUser = new userModel ({
                    firstName,
                    lastName,
                    email,
                    password: createHash(password)
                })

                const result = await newUser.save()


                return done(null, result)

            } catch (error) {
                return done('Error registrando usuario :' + error)
            }
        }
    ))

    passport.use('login', new localStrategy(
        { passReqToCallback: true, usernameField: "email" },
        async (req, email, password, done) => {
            console.log("Intento de login con email:", email);
        console.log("Contraseña recibida:", password)
        
            try {
                const user = await userModel.findOne({ email })
                if (!user) {
                    console.warn('Usuario no encontrado en passport.js')
                    return done(null, false, { massage: 'user o password invalido' })
                }

                if (!isValidPassword(user, password)) {
                    console.warn('Contraseña incorrecta en passport.js')
                    return done(null, false, { massage: 'user o password invalido' })
                }
                console.log('Inicio de sesión exitoso')
                return done(null, user)

            } catch (error) {
                return done(error)
            }
        }

    )) 

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    passport.deserializeUser(async (id, done) => {
        try {
            let user = await userModel.findById(id)
            done(null, user)
        } catch (error) {
            console.log("error al deserializar user" + error)
        }
    })
}

const cookieExtractor = req =>{
    let token = null
    console.log("entrando a cokkie extractor")

    if (req && req.cookies) {
        console.log('cookies obtenida')
        console.log(req.cookies)
        token = req.cookies['jwtCookieToken']
        console.log(token)
    }
    return token
}



export default initializePassport
 */


import passport from "passport"
import passportLocal from "passport-local"
import GitHubStrategy from 'passport-github2'
import jwtStrategy from 'passport-jwt'
import UsersDAO from '../dao/mongodb/usersDAO.js'
import { createHash, isValidPassword, PRIVATE_KEY } from '../../utils.js'

const JwtStrategy = jwtStrategy.Strategy
const ExtractJWT = jwtStrategy.ExtractJwt
const localStrategy = passportLocal.Strategy
const usersDaoInstance = new UsersDAO()

const initializePassport = () => {

    passport.use('jwt', new JwtStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
            secretOrKey: PRIVATE_KEY
        },
        async (jwt_payload, done) => {
            console.log("entrando a passport strategy con JWT")
            try {
                console.log("jwt obtenido del payload")
                console.log(jwt_payload)
                const user = await usersDaoInstance.getUserById(jwt_payload.user._id)
                if (!user) {
                    return done(null, false)
                }
                return done(null, user)
            } catch (error) {
                console.log(error)
                return done(error)
            }
        }
    ));

    passport.use('github', new GitHubStrategy(
        {
            clientID: 'Iv1.b42560ee6348422e',
            clientSecret: '5edb99fd472cfd85d1e0699c7ec137d422d4c3ae',
            callbackUrl: 'http://localhost:8080/api/githubcallback'
        }, async (accessToken, refreshToken, profile, done) => {
            console.log("perfil obtenido de github en passport js")
            console.log(profile)
            console.log(profile._json.email)
            try {
                const user = await usersDaoInstance.getUserByEmail(profile._json.email)
                if (!user) {
                    let newUser = {
                        firstName: profile._json.name,
                        lastName: '',
                        email: profile._json.email,
                        password: ''
                    };
                    const result = await usersDaoInstance.createUser(newUser)
                    return done(null, result)
                } else {
                    return done(null, user)
                }
            } catch (error) {
                return done(error)
            }
        }
    ))

    passport.use('register', new localStrategy(
        { passReqToCallback: true, usernameField: "email" },
        async (req, username, password, done) => {
            try {
                const { firstName, lastName, email } = req.body;
                const exist = await usersDaoInstance.getUserByEmail(email)

                if (exist) {
                    return done(null, false, { message: 'El correo electrónico ya está registrado' })
                }

                const newUser = {
                    firstName,
                    lastName,
                    email,
                    password: createHash(password)
                }

                const result = await usersDaoInstance.createUser(newUser)
                return done(null, result)
            } catch (error) {
                return done('Error registrando usuario: ' + error)
            }
        }
    ))

    passport.use('login', new localStrategy(
        { passReqToCallback: true, usernameField: "email" },
        async (req, email, password, done) => {
            console.log("Intento de login con email:", email)
            console.log("Contraseña recibida:", password)
            try {
                const user = await usersDaoInstance.getUserByEmail(email)
                if (!user) {
                    console.warn('Usuario no encontrado en passport.js');
                    return done(null, false, { message: 'Usuario o contraseña inválidos' })
                }

                if (!isValidPassword(user, password)) {
                    console.warn('Contraseña incorrecta en passport.js');
                    return done(null, false, { message: 'Usuario o contraseña inválidos' })
                }
                console.log('Inicio de sesión exitoso')
                return done(null, user)
            } catch (error) {
                return done(error)
            }
        }
    ))

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await usersDaoInstance.getUserById(id)
            done(null, user)
        } catch (error) {
            console.log("error al deserializar user" + error)
            done(error)
        }
    })
}

export const cookieExtractor = async (req) => {
    try {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies["nombre_de_la_cookie"]; // Cambia "nombre_de_la_cookie" por el nombre real de tu cookie
        }

        // Aquí puedes realizar operaciones asíncronas si es necesario, como consultar una base de datos
        await operacionAsincrona(token); // Reemplaza operacionAsincrona por la operación asíncrona real

        return token;
    } catch (error) {
        console.error("Error al extraer la cookie:", error);
        throw error;
    }
};
/* const cookieExtractor = req => {
    let token = null
    console.log("entrando a cookie extractor")
    if (req && req.cookies) {
        console.log('cookies obtenida')
        console.log(req.cookies)
        token = req.cookies['jwtCookieToken']
        console.log(token)
    }
    return token
} */

export default initializePassport
