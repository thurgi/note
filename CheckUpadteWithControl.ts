import {Observable, takeWhile, repeat, exhaustMap,} from 'rxjs';

let count = 0;
setInterval(() => count++, 4000)
function getCheckLastErrorLocalUpdate(): Observable<boolean> {
    return new Observable(subscriber => {
        subscriber.next(count < 4);
        subscriber.complete();
    })
}
function callVersion(): Observable<string> {
    return new Observable(subscriber => {
        setTimeout(()=> {
            subscriber.next('0.1.2');
            subscriber.complete();
        }, 500)
    })
}
function updateFile(): Observable<boolean> {
    return new Observable(subscriber => {
        setTimeout(()=> {
            subscriber.next(true);
            subscriber.complete();
        }, 500)
    })
}

function redirect(){
    console.log('redirection')
}

const localVersion = '0.1.2';
const faireMiseAJour = new Observable(subscriber => {
    callVersion().subscribe(value => {
        console.log('callVersion subscribe', value)
        if(value===localVersion){
            updateFile().subscribe(res => {
                if(res) {
                    subscriber.next(true);
                    subscriber.complete();
                }
            })
        } else {
            subscriber.next(false);
            subscriber.complete();
        }
    })
})

faireMiseAJour
    .pipe(exhaustMap(getCheckLastErrorLocalUpdate))
    .pipe(
        repeat({delay:1000}),
        takeWhile(x => {
            console.log('takeWhile', x)
            return x
        })
    )
    .subscribe(res => {
        console.log('subscribe', res)
        if(res) {
            redirect()
        }
    })
