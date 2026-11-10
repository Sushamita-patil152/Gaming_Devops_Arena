pipeline {
    agent any

    environment {
        APP_NAME  = 'devops-arena'
        IMAGE_TAG = "v${BUILD_NUMBER}"
        PORT      = '80'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Files') {
            steps {
                sh '''
                    test -f index.html
                    test -f style.css
                    test -f script.js
                    test -f Dockerfile
                '''
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest ."
            }
        }

        stage('Docker Deploy') {
            steps {
                sh '''
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    docker run -d --name ${APP_NAME} -p ${PORT}:80 ${APP_NAME}:latest
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline deployed successfully."
        }
        failure {
            echo "Pipeline failed. Check build logs."
        }
    }
}
