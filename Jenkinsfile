pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "seebamaldar/devops-arena"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:latest .'
            }
        }

        stage('Push to My Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER1',
                    passwordVariable: 'PASS1'
                )]) {
                    sh '''
                        echo "$PASS1" | docker login -u "$USER1" --password-stdin
                        docker push $DOCKER_IMAGE:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker stop devops-arena || true
                    docker rm devops-arena || true
                    docker run -d --name devops-arena -p 80:80 $DOCKER_IMAGE:latest
                '''
            }
        }
    }
}
