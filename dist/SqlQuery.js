"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rp = require("request-promise");
const xml2js = require("xml2js");
class SqlQuery {
    constructor(instance_crn, token, endpoint = 'https://sql-api.ng.bluemix.net/v2') {
        this.instance_crn = instance_crn;
        this.token = token;
        this.endpoint = endpoint;
        if (!instance_crn) {
            throw new Error(`SQL Query instance CRN is not defined`);
        }
        if (!token) {
            throw new Error(`IAM Token is not defined`);
        }
        const url = `${endpoint}/sql_jobs?instance_crn=${instance_crn}`;
        // options (mostly) common to all the APIs
        this.options = {
            url,
            headers: {
                accept: 'application/json'
            },
            auth: {
                bearer: token
            },
            json: true,
        };
    }
    getCosKey(endpoint, auth, bucket, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield rp({
                url: `https://${endpoint}/${bucket}?prefix=${encodeURIComponent(prefix)}`,
                auth,
            });
            return new Promise((resolve, reject) => {
                xml2js.parseString(response, (err, result) => err ? reject(err) : resolve(result));
            });
        });
    }
    runSqlJob(statement, resultset_target) {
        console.log(`Running SQL Query job ${statement} with resultset ${resultset_target}`);
        if (!statement || !resultset_target) {
            throw new Error(`Missing args found in SQL Query job`);
        }
        return rp(Object.assign({}, this.options, {
            method: 'POST',
            body: {
                statement,
                resultset_target
            }
        }));
    }
    getSqlJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield rp(Object.assign({}, this.options, {
                url: `${this.endpoint}/sql_jobs/${jobId}?instance_crn=${this.instance_crn}`
            }));
            const [endpoint, bucket, ...rest] = response.resultset_location.substring(6).split('/');
            let key = rest.join('/');
            const cos = yield this.getCosKey(endpoint, this.options.auth, bucket, `${key}/part`);
            key = cos.ListBucketResult.Contents[0].Key[0];
            return Object.assign({}, response, { endpoint, bucket, key });
        });
    }
    getSqlJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            return rp(this.options);
        });
    }
}
exports.SqlQuery = SqlQuery;
function main(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { endpoint = 'https://sql-api.ng.bluemix.net/v2', instance_crn, apiKey, statement, resultset_target, job_id } = params;
        let { token } = params;
        // apiKey provided - get IAM token
        if (apiKey) {
            const response = yield rp({
                url: 'https://iam.bluemix.net/identity/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                method: "POST",
                body: `apikey=${apiKey}&grant_type=urn%3Aibm%3Aparams%3Aoauth%3Agrant-type%3Aapikey`,
                json: true
            });
            token = response.access_token;
        }
        const sqlQuery = new SqlQuery(instance_crn, token, endpoint);
        // user provided a statement - intent is to run SQL Query job
        if (statement) {
            return sqlQuery.runSqlJob(statement, resultset_target);
        }
        // user provided a job ID - intent is to get a SQL Query job
        if (job_id) {
            return sqlQuery.getSqlJob(job_id);
        }
        // assume the intent is the list of recent jobs
        return sqlQuery.getSqlJobs();
    });
}
exports.default = main;
