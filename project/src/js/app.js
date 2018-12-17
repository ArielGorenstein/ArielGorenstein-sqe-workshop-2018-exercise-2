import $ from 'jquery';
import {parseCode} from './code-analyzer';

$(document).ready(function () {
    $('#Sbtn').click(() => {
        let code = $('#txt1').val();
        let args = $('#txt2').val();
        let ans = parseCode(code, args);
        document.getElementById('txt3').innerHTML = ans.join('<br>');
        //$('#txt3').val(ans.join('\n'));
        //$('#txt3').val(JSON.stringify(parseCode(code)));
    });
});