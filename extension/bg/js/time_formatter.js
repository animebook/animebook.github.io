class TimeFormatter {

    padWithZeros(num, digits) {
        return ("0000" + num).slice(-digits);
    };

    createDateTimeString() {
        const date = new Date();
        return [
            date.getFullYear(),
            this.padWithZeros(date.getMonth() + 1, 2),
            this.padWithZeros(date.getDate(), 2),
            this.padWithZeros(date.getHours(), 2),
            this.padWithZeros(date.getMinutes(), 2),
            this.padWithZeros(date.getSeconds(), 2)
        ].join('-')
    }

}