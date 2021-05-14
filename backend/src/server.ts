import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as ConnectDatadog from 'connect-datadog'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as helmet from 'helmet'
import * as methodOverride from 'method-override'
import * as morgan from 'morgan'
import * as path from 'path'
import { GlobalAcceptMimesMiddleware, GlobalErrorHandlerMiddleware,
  ServerLoader, ServerSettings } from 'ts-express-decorators'
import { ENV, PORT } from './config'

const rootDir = path.resolve(__dirname)

@ServerSettings({
  rootDir,
  port: PORT,
  httpsPort: false,
  mount: {
    '/api/v1/': `${rootDir}/controllers/**/*.js`,
  },
  acceptMimes: ['application/json'],
  debug: ENV === 'development',
  componentsScan: [
    `${rootDir}/services/**/**.js`,
    `${rootDir}/middlewares/**/**.js`,
  ],
  logger: {
    debug: false,
    logRequest: true,
    requestFields: ['reqId', 'method', 'url', 'headers', 'query', 'params', 'duration'],
  },
})
export default class Server extends ServerLoader {

  public $onMountingMiddlewares() {
    this
      .use(morgan('combined'))
      .use(GlobalAcceptMimesMiddleware)
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({ extended: true }))
      .use(compression())
      .use(methodOverride())
      .use(cors())
      .use(cookieParser())
      .use(ConnectDatadog({ response_code: true, tags: ['app:stream'] }))
      .use(helmet())

    if (!this.getSettingsService().debug) {
      this.set('trust proxy', 1)
    }
  }

  public $afterRoutesInit() {
    this.use(GlobalErrorHandlerMiddleware)
  }
}
