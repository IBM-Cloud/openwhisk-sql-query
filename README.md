# SQL Query Package

The OpenWhisk SQL Query package provides a set of actions for interacting with SQL Query instances. These actions allow you to submit, retrieve and list SQL Query jobs.

## OpenWhisk entities
| Entity | Type | Parameters | Description |
|--------|------|------------|-------------|
| openwhisk-sql-query | package  | endpoint, apiKey, instance_crn, resultset_target | Work with an SQL Query instance. |
| sql-query           | action   | endpoint, apiKey, instance_crn, statement, resultset_target | Execute a SQL Query job. |
| sql-query           | action   | endpoint, apiKey, instance_crn, job_id | Get a specific SQL Query job. |
| sql-query           | action   | endpoint, apiKey, instance_crn | Get a list of recently submitted SQL Query jobs. |
| sql-job-resultset   | sequence | endpoint, apiKey, job_id | Gets CSV data |

## Parameters
| Parameter | Description |
| --------- | ----------- |
| endpoint | SQL Query API endpoint; defaults to 'https://sql-api.ng.bluemix.net/v2' |
| apiKey | Platform API key used to obtain an IAM token |
| instance_crn | SQL Query instance CRN obtained from service instance |
| resultset_target | Cloud Object Storage bucket to store results |
| statement | SQL to execute |
| job_id  | SQL Query job to retrieve |

## Before you begin

Before you can run SQL Query jobs, you need to have a service instance of SQL Query and one or more Cloud Object Storage buckets to hold the data to be analyzed and also hold the query results.

1. Follow the instructions in the [Getting Started Tutorial](https://console.bluemix.net/docs/services/sql-query/getting-started.html#getting-started-tutorial).

Obtain the Instance CRN of your SQL Query service instance to be used with the package.

2. In the [Dashboard](https://console.bluemix.net/dashboard), access you SQL Query instance.
3. Click the **Instance CRN** button to copy it to the clipboard, and set an environment variable.

```sh
export INSTANCE_CRN=<your instance crn>
```

SQL Query requires an IAM token to be used when making API calls. Since IAM tokens expire after 60 minutes, it's advised to create an API Key that will be used to generate an IAM token when the functions run. The API key will be saved during package deployment.

4. Create an API key for your own personal identity, copy the key value, and save it in a secure place. Do this from either the UI or command line:

    - UI: Log in to IBM Cloud and select [Manage > Security > Platform API Keys](https://console.bluemix.net/iam/#/apikeys). After you leave the page, you will no longer be able to access this value.
    - Command Line:
        ```sh
        export API_KEY=`ibmcloud iam api-key-create sql-query-key -d 'apiKey created for http://github.com/IBM-Cloud/openwhisk-sql-query' | grep 'API Key' | awk ' {print $3} '`
        ```

## Installing the SQL Query package

Use the Cloud Functions CLI plugin to install the SQL Query package into your namespace.

1. [Install the Cloud Functions plugin for the IBM Cloud CLI](bluemix_cli.html#cloudfunctions_cli).
2. Install the `wskdeploy` command. See the [Apache OpenWhisk documentation](https://github.com/apache/incubator-openwhisk-wskdeploy#building-the-project).

To install the SQL Query package:

1. Clone the SQL Query package repo.
    ```sh
    git clone https://github.com/IBM-Cloud/openwhisk-sql-query.git
    ```

2. Deploy the package.
    ```sh
    wskdeploy --param instance_crn $INSTANCE_CRN --param apiKey <your API key>
    ```

3. Verify that the `openwhisk-sql-query` package is added to your package list.
    ```sh
    ibmcloud fn package list
    ```

    Output:
    ```sh
    packages
    /myOrg_mySpace/openwhisk-sql-query private
    ```

## Binding Object Storage Credentials

The SQL Query package relies on the Cloud Object Storage package. This requires you to bind credentials with Cloud Object Storage as described [here](https://console.bluemix.net/docs/openwhisk/cloud_object_storage_actions.html#cloud_object_storage_actions).

1. From the CLI, create your credentials.

    ```sh
    ibmcloud resource service-key-create sql-query-cos-credentials Writer --instance-name <your COS instance name> --parameters '{"HMAC":true}'
    ```
2. Bind the credentials to the Cloud Object Storage package.

    ```sh
    ibmcloud fn service bind cloud-object-storage cloud-object-storage --instance <your COS instance name>
    ```

## Using the package

1. From the CLI, login to IBM Cloud.
2. Execute the samples using the CLI.

    ### Run a SQL Query job

    ```sh
    export TARGET=cos://<your region>/<your bucket name>
    ```

    ```sh
    ibmcloud fn action invoke openwhisk-sql-query/sql-query -p resultset_target $TARGET -p statement "SELECT e1.firstname employee, e2.firstname colleague, e1.city FROM cos://us-geo/sql/employees.parquet STORED AS PARQUET e1, cos://us-geo/sql/employees.parquet STORED AS PARQUET e2 WHERE e2.city = e1.city AND e1.employeeid <> e2.employeeid AND e1.firstname = 'Steven' ORDER BY e1.city , e1.firstname" -r
    ```

    ### Get a specific SQL Query job

    ```sh
    export JOB_ID=<job id returned from running a job>
    ```

    ```sh
    ibmcloud fn action invoke openwhisk-sql-query/sql-query -p job_id $JOB_ID -r
    ```

    ### Get recent SQL Query jobs

    ```sh
    ibmcloud fn action invoke openwhisk-sql-query/sql-query -r
    ```

### Combining with Cloud Object Storage

You can retrieve the results of a SQL Query job by easily combining it with the [Cloud Object Storage package](https://console.bluemix.net/docs/openwhisk/cloud_object_storage_actions.html#cloud_object_storage_actions). For convenience, a `sql-job-resultset` sequence is available in the SQL Query package.

```sh
ibmcloud fn action invoke openwhisk-sql-query/sql-job-resultset -p job_id $JOB_ID -r
```

This produces a JSON object, which contains CSV data in the `body`:

```javascript
{
    "body": "employee,colleague,city\nSteven,Anne,London\nSteven,Robert,London\nSteven,Michael,London\n",
    "headers": {
        "Content-Type": "text/csv"
    },
    "statusCode": 200
}
```

## REST APIs

The `sql-query` and `sql-job-resultset` sequences are also exposed as APIs. To limit usage to authorized applications, use the `Require applications to authenticate via API key` definition option seen on the [SQL Query API management page](https://console.bluemix.net/openwhisk/apimanagement).

For example, to obtain CSV results simply use a browser URL. The public accessibility of CSV data can now be used with additional services such as Cognos Dashboard Embedded.

```curl
https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/<your managed api id>/sql/results?job_id=28c8cf5e-3510-419a-8bc2-dd53b4f595ab
```
