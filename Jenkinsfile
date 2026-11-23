pipeline {
    agent any

    environment {
        MY_IMAGE = "sushamita152/devops-arena"
        FRIEND_IMAGE = "seebamaldar/devops-arena"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'docker build -t $MY_IMAGE:latest .'
                sh 'docker tag $MY_IMAGE:latest $FRIEND_IMAGE:latest'
            }
        }

        stage('Push to Both Accounts') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER1',
                    passwordVariable: 'PASS1'
                )]) {
                    sh '''
                        echo "$PASS1" | docker login -u "$USER1" --password-stdin
                        docker push $MY_IMAGE:latest
                        docker logout
                    '''
                }
                withCredentials([usernamePassword(
                    credentialsId: 'friend-dockerhub-creds',
                    usernameVariable: 'USER2',
                    passwordVariable: 'PASS2'
                )]) {
                    sh '''
                        echo "$PASS2" | docker login -u "$USER2" --password-stdin
                        docker push $FRIEND_IMAGE:latest
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
