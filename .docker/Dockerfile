FROM rocketchat/base:12.16.1

ADD . /app

LABEL maintainer="buildmaster@rocket.chat"

RUN set -x \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear --force \
 && chown -R rocketchat:rocketchat /app

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo1:27017/rocketchat?replSet=rs01 \
    MONGO_OPLOG_URL= mongodb://mongo1:27017/local?replSet=rs01 \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=https://rchat.maxiconsystems.com.br \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]

