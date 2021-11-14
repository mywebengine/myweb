#!/usr/bin/perl -w

my $in = "./";
my $out = "./tmp";
my $v = '0.9.0';
my $indexjs = "$out/myweb.js";

my %import;
my $res = "";

go("");

open(my $fh, ">myweb.min.js") || die;
my @imports;
while (my ($url, $data) = each(%import)) {
	$data =~ s!\\!\\\\!g;
	$data =~ s/\r*\n/\\\\n\\\n/g;
	$data =~ s/'/\\'/g;
	push(@imports, sprintf('["%s", import(\'%s\')]', $url, $data));
}
print $fh '/*!
 * myweb v$v
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
await Promise.all(self.__imp__=new Map(['.join(",\n", @imports).']));
';
open(my $mh, "$indexjs") || die;
while (my $i = <$mh>) {
	print $fh $i;
}
close($mh);
close($fh);

sub go {
	my ($dir) = @_;
	opendir(my $dh, "$in/$dir") || die;
	foreach my $f (readdir($dh)) {
		next if ($f eq '.' || $f eq '..' || $f eq 'examples');
		$f = "$dir/$f";
		my $ff = "$in/$f";
		$ff =~ s!//!/!g;
		my $oo = "$out/$f";
		$oo =~ s!//!/!g;
		if (-d $ff) {
next if ($f eq '/tmp');
			unless (-d $oo) {
				mkdir($oo);
			}
			go($f);
			next;
		}
		next if ($f !~ /\.js$/);
next if ($f eq '/myweb.min.js');
		`npx uglifyjs --mangle -o $oo -- $ff`;
		open(my $fh, "$oo") || die;
print "$oo\n";
		my $cnt = "";
		while (my $i = <$fh>) {
			$cnt .= $i;
		}
		close($fh);
		my $top = $f;
		if ($top =~ /\//) {
			$top =~ s!(.*/).+!$1!;
		} else {
			$top = '';
		}
		my @p;
		my @d;
		my @n;
		while ($cnt =~ s/import\s*([`'"])(.+?)\1(;|\r*\n|$)//) {
			my $url = normalize_url($2, $top);
			push(@p, sprintf('self.__imp__.get("%s")', $url));
			push(@d, undef);
			push(@n, []);
		}
		while ($cnt =~ s/import\s*(.+?)\s*from\s*([`'"])(.+?)\2(;|\r*\n|$)//) {
			my ($name, $url, @names) = ($1, normalize_url($3, $top));
			if ($name =~ s/\{(.*?)\}//) {	
				@names = split(/\s*,\s*/, $1);
			}
			$name =~ s/(^\s+|\s+$)//g;
			push(@p, sprintf('self.__imp__.get("%s")', $url));
			push(@d, $name);
			push(@n, \@names);
		}
		if (@p) {
			my $dcnt = 'let m;';#sprintf('Promise.all([%s]).then(arr=>{const l=arr.length;for(let i=0;i<l;i++){', join(',', @p));
			my @lets;
			for (my $i = 0; $i < @p; $i++) {
				my @v;
				if ($d[$i]) {
					push(@v, sprintf('%s=m.default;', $d[$i]));
					push(@lets, $d[$i]);
				}
				foreach my $p (@{$n[$i]}) {
					push(@v, sprintf('%s=m.%s;', $p, $p));#todo AS
					push(@lets, $p);
				}
				if (@v) {
					$dcnt .= sprintf('m=arr[%d];%s', $i, join('', @v));
				}
			}
			$cnt = sprintf('let %s;import.meta.__thisImports__=Promise.all([%s]).then(arr=>{%s});%s', join(',', @lets), join(',', @p), $dcnt, $cnt);
=sdfdsf
			my $dcnt = 'const ret=[];let m;';
			my @lets;
			for (my $i = 0; $i < @p; $i++) {
				my @v;
				if ($d[$i]) {
					push(@v, 'ret.push(m.default);');
					push(@lets, $d[$i]);
				}
				foreach my $p (@{$n[$i]}) {
					push(@v, sprintf('ret.push(m.%s);', $p));#todo AS
					push(@lets, $p);
				}
				if (@v) {
					$dcnt .= sprintf('m=arr[%d];%s', $i, join('', @v));
				}
			}
			$cnt = sprintf('const [%s]=await Promise.all([%s]).then(arr=>{%sreturn ret});%s', join(',', @lets), join(',', @p), $dcnt, $cnt);
=cut
		}
		if ($f ne '/myweb.js') {
			$import{$f} = 'data:text/javascript;text,'.$cnt;
			next;
		}
		open($fh, ">$oo") || die;
		print $fh $cnt;
		close($fh);
	}
}

sub normalize_url {
	my ($url, $top) = @_;
	if ($url !~ /^\//) {
		$url = $top.$url;
	}
	$url =~ s!(/\./|/+)!/!g;
	$url =~ s![^/]+/\.\./!!g;
	$url;
}
