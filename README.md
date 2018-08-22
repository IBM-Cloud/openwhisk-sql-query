# SQL Query Package

The SQL Query package provides a set of actions for interacting with SQL Query instances. These actions allow you to submit, retrieve and list SQL Query jobs.

The SQL Query package includes the following actions:

| Entity              | Type    | Parameters                                              | Description                                      |   |
|---------------------|---------|---------------------------------------------------------|--------------------------------------------------|---|
| openwhisk-sql-query | package | endpoint, token, instance_crn, resultset_target        | Work with an SQL Query instance.                 |   |
| sql-query           | action  | endpoint, token, instance_crn, statement, resultset_target | Execute a SQL Query job.                         |   |
| sql-query           | action  | endpoint, token, instance_crn, job_id                     | Get a specific SQL Query job.                    |   |
| sql-query           | action  | endpoint, token instance_crn                            | Get a list of recently submitted SQL Query jobs. |   |

## Creating an SQL Query service instance

## Before you begin
{: #prereqs}

Before you can run SQL queries, you need to have one or more Cloud Object Storage buckets to hold the data to be analyzed and to hold the query results.
Cloud Object Storage offers several plans, including a free "Lite" plan.
To create an Cloud Object Storage instance:
1. Go to the [**IBM Cloud Catalog > Storage > Object Storage**](https://console.bluemix.net/catalog/infrastructure/cloud-object-storage) page.
2. Select one of the plans and create the service.  

   If you want to find your Cloud Object Storage instance at a later point of time, go to your  
   [**IBM Cloud Dashboard > Services**](https://console.bluemix.net/dashboard/apps). 
(If you do not see it in the list, select the resource group "All Resources".)

You can now manage and browse the buckets and data the instance contains. 
Click [here](https://console.bluemix.net/docs/services/cloud-object-storage/getting-started.html#getting-started-console) 
for more information about how to use Cloud Object Storage.

#### Create your SQL Query service instance

1. Go to the [**IBM Cloud Catalog**](https://console.bluemix.net/catalog) and search for **SQL Query**.
2. Click **SQL Query** to open the Catalog details page.
3. Select the Lite plan and Click **Create** to create an instance of the service.
4. Click **Open UI** on the Dashboard page to open the SQL Query Console.
When you do this for the first time, the SQL Query service automatically creates a bucket for you in your Cloud Object Storage instance.
It uses this bucket as the default target for your query results.

## Installing the SQL Query package

After you have an SQL Query service instance, use the Cloud Functions CLI to install the SQL Query package into your namespace.

### Installing from the Cloud Functions CLI

Before you begin:
1. [Install the Cloud Functions plugin for the IBM Cloud CLI](bluemix_cli.html#cloudfunctions_cli).
2. Install the `wskdeploy` command. See the [Apache OpenWhisk documentation](https://github.com/apache/incubator-openwhisk-wskdeploy#building-the-project).

To install the SQL Query package:

1. Clone the SQL Query package repo.
    ```sh
    git clone https://github.com/van-ibm/openwhisk-sql-query.git
    ```

2. Deploy the package. If you later decide to run the actions in this package in the other runtime, you can repeat the previous step and this step to redeploy the package.
    ```sh
    wskdeploy -m manifest.yaml
    ```

3. Verify that the `open-whisk-sql` package is added to your package list.
    ```sh
    ibmcloud fn package list
    ```

    Output:
    ```sh
    packages
    /myOrg_mySpace/open-whisk-sql private
    ```

## Run a SQL Query Job

1. From the CLI, login to IBM Cloud.
2. Export the following variables to be used with the package.

    ```sh
    export IAM_TOKEN=`ibmcloud iam oauth-tokens | head -n 1 | awk ' {print $4} '`
    ```

    ```sh
    export INSTANCE_CRN=<your SQL Query instance CRN>
    ```

    ```sh
    export TARGET=cos://<your region>/<your bucket name>
    ```

3. Invoke the `openwhisk-sql-query` package's function.
  
    ```sh
    ibmcloud fn action invoke openwhisk-sql-query/sql-query -p token $IAM_TOKEN -p resultset_target $TARGET -p instance_crn $INSTANCE_CRN -p statement "SELECT e1.firstname employee, e2.firstname colleague, e1.city FROM cos://us-geo/sql/employees.parquet STORED AS PARQUET e1, cos://us-geo/sql/employees.parquet STORED AS PARQUET e2 WHERE e2.city = e1.city AND e1.employeeid <> e2.employeeid AND e1.firstname = 'Steven' ORDER BY e1.city , e1.firstname" -r
    ```