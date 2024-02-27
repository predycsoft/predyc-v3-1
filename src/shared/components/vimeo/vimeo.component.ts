import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import VimeoPlayer from '@vimeo/player';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';  
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-vimeo',
  templateUrl: './vimeo.component.html',
  styleUrls: ['./vimeo.component.css'],
  imports:[CommonModule],
  standalone: true
})
export class VimeoComponent {

  constructor(
    public icon: IconService,
    private activeModal: NgbActiveModal,
    private sanitizer: DomSanitizer,
  ) {}
  
  @Input() clase = null;
  private player
  safeUrl;
  base64Video = null;
  videoReady: boolean = false

  async ngOnInit() {

    console.log('videoToSee',this.clase)
    this.base64Video = this.clase?.base64Video
    this.initVideo();

  }

  // Inicializa un url seguro para la primera clase de video que sea inyectada al componente
  initVideo(): void {
    if (!this.videoReady) {
      let videoURL;
      if(!this.clase?.vimeoId2){
        videoURL =
        'https://player.vimeo.com/video/' +
        this.clase.vimeoId1 +
        '?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';
      }
      else{
        videoURL =
        'https://player.vimeo.com/video/' +
        this.clase.vimeoId1 + '?h='+this.clase.vimeoId2+'&amp'
        '?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';
      }
      //console.log('videoURL',videoURL)
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL)
    } else {
      this.loadVideo()
    }
  }


  // Si ya el reproductor esta cargado por hubo una clase de video previa esta función solo cmabia el video
  loadVideo(): void {
    this.player
    .loadVideo(this.clase.vimeoId1)
    .then(function (id) {   
      // the video successfully loaded
      this.initPlayer();
    })
    .catch(function (error) {
      switch (error.name) {
        case 'TypeError':
          // the id was not a number
          break;

        case 'PasswordError':
          // the video is password-protected and the viewer needs to enter the
          // password first
          break;

        case 'PrivacyError':
          // the video is password-protected or private
          break;

        default:
          // some other error occurred
          break;
      }
    });
  }

  timer(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  playing = false
  async initPlayer()  {
    if(!this.videoReady){
      this.initVideo()
      this.videoReady = true
    } else {
      await this.timer(100)
      var iframe = document.querySelector('iframe');
      if(iframe){
        this.player = new VimeoPlayer(iframe, {
          autoplay: true,
        });
        if(this.player){
          let completedVideo = 0
          let tiempoVisto = 0
          let step = 0
          this.player.on('play', (data) => {
            completedVideo = 0;
            //console.log("play")
            this.playing = true
            //this.playClass();
          });
          this.player.on('pause', (data) => {
            this.playing = false
            //console.log("pause")
          });
          const tolerance = 0.01;

          this.player.on('timeupdate', (data) => {
            tiempoVisto += .250
            step += 1
            if(step  == 4){
              // //console.log("tiempo visto: "+tiempoVisto+"s")
              step = 0
            }
          });
        } else {
          //console.log("player not found")
        }
        
      } else {
        //console.log("iframe not found")
      }
    }
   
    
  }

  dismiss() {
    this.activeModal.dismiss('User closed modal')
  }


}
