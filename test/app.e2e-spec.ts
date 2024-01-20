import {Test} from "@nestjs/testing"
import { AppModule } from "../src/app.module"
import * as pactum from 'pactum'
import { INestApplication, ValidationPipe } from "@nestjs/common"
import { PrismaService } from "../src/prisma/prisma.service"
import { AuthDto } from "src/auth/dto"
import { EditUserDto } from "src/user/dto"
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto"


describe('App e2e', () => { 
  let app:INestApplication
  let prisma:PrismaService
  beforeAll(async ()=>{
    const moduleRef= await Test.createTestingModule({
      imports:[AppModule]
    }).compile(); 
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist:true,
    }))
    await app.init();
    await app.listen(3333)
    prisma= app.get(PrismaService)
    await prisma.cleanDb();
    pactum.request.setBaseUrl("http://localhost:3333")
  })
  afterAll(()=>{
    app.close();
  })

  describe('Auth', () => { 
    const dto: AuthDto={
      email:'me.test123@gmail.com',
      password:'1234'
    }
    describe('Signup', () => {
      it('should throw if email empty',()=>{
        return pactum.spec().post(
          '/auth/signup'
        ).withBody({password:dto.password}).expectStatus(400)
      })
      
      it('should throw if password empty',()=>{
        return pactum.spec().post(
          '/auth/signup'
        ).withBody({email:dto.email}).expectStatus(400)
      })

      it('should throw if body empty',()=>{
        return pactum.spec().post(
          '/auth/signup'
        ).expectStatus(400)
      })

      it('should signup',()=>{
        return pactum.spec().post(
          '/auth/signup'
        ).withBody(dto).expectStatus(201).stores('UserAt','access_token')
      })
    })
    
    describe('Login', () => {
      it('should throw if email empty',()=>{
        return pactum.spec().post(
          '/auth/login'
        ).withBody({password:dto.password}).expectStatus(400)
      })
      
      it('should throw if password empty',()=>{
        return pactum.spec().post(
          '/auth/login'
        ).withBody({email:dto.email}).expectStatus(400)
      })

      it('should throw if body empty',()=>{
        return pactum.spec().post(
          '/auth/login'
        ).expectStatus(400)
      })

      it('should login',()=>{
        return pactum.spec().post(
          '/auth/login'
        ).withBody(dto).expectStatus(200).stores('UserAt','access_token')
      })
    })
  })
  describe('User', () => {
    describe('Get me', () => {
      it('should return current user',()=>{
        return pactum.spec().get(
          '/users/me'
        ).withBearerToken('$S{UserAt}').expectStatus(200)
      })
      })
      describe('Edit user', () => {
        const dto:EditUserDto={
          firstName:'ahmad',
          lastName:'hussain',
          email:'edited.email@gmail.com'
        }
        it('should edit current user',()=>{
          return pactum.spec().patch(
            '/users'
          ).withBearerToken('$S{UserAt}').withBody(dto).expectStatus(200)
        })
      })
    })
  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it("should return bookmarks",()=>{
        return pactum.spec().get(
          '/bookmarks'
        ).withBearerToken('$S{UserAt}').expectStatus(200).expectBody([])
      })
    })
    describe('Create bookmark', () => {
      const dto:CreateBookmarkDto = {
        title:'youtube video',
        link:'https://www.youtube.com/watch?v=31k6AtW-b3Y'
      }
      it("should create bookmarks",()=>{
        return pactum.spec().post(
          '/bookmarks'
        ).withBearerToken('$S{UserAt}').withBody(dto).expectStatus(201)
        .stores('bookmarkId','id')
      })
    })

    describe('Get bookmarks', () => {
      it("should return bookmarks",()=>{
        return pactum.spec().get(
          '/bookmarks'
        ).withBearerToken('$S{UserAt}').expectStatus(200).expectJsonLength(1);
      })
    })

    describe('Get bookmark by id', () => {
  
        it("should get bookmarks by id",()=>{
          return pactum.spec().get(
            '/bookmarks/{id}'
          ).withPathParams('id','$S{bookmarkId}')
          .withBearerToken('$S{UserAt}').expectStatus(200).expectBodyContains('$S{bookmarkId}');
    })
  })

    describe('Edit bookmark by id', () => {
      const dto:EditBookmarkDto = {
        title:'Study video',
        description:'Padhai karne ka video dekh lo guys'
      }
      it("should edit bookmarks",()=>{
        return pactum.spec().patch(
          '/bookmarks/{id}'
        ).withPathParams('id','$S{bookmarkId}')
        .withBearerToken('$S{UserAt}').withBody(dto).expectStatus(200)
        .expectBodyContains(dto.title).expectBodyContains(dto.description)
      })
    })

    describe('Delete bookmark by id', () => {
      it("should delete bookmarks",()=>{
        return pactum.spec().delete(
          '/bookmarks/{id}'
        ).withPathParams('id','$S{bookmarkId}')
        .withBearerToken('$S{UserAt}').expectStatus(204)
      })
      it("should get empty bookmarks",()=>{
          return pactum.spec().get(
            '/bookmarks'
          ).withBearerToken('$S{UserAt}').expectStatus(200).expectJsonLength(0)
      })
    })
  })

});