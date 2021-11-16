#!/usr/bin/perl -w

my $v = '0.9.01';
my $in = "./";

my %import;
my $index = "";

go("");

open(my $fh, ">./myweb.min.js") || die;
my @imports;
while (my ($url, $data) = each(%import)) {
	$data =~ s!\\!\\\\!g;
	$data =~ s/\r*\n/\\\\n/g;
	$data =~ s/'/\\'/g;
	push(@imports, sprintf('["%s", import(\'%s\')]', $url, $data));
}
print $fh '/*!
 * myweb v'.$v.'
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
await Promise.all(self.__import__=new Map(['.join(",\n", @imports).']));
'.$index;
close($fh);

sub go {
	my ($dir) = @_;
	opendir(my $dh, "$in/$dir") || die;
	foreach my $f (readdir($dh)) {
		next if ($f eq '.' || $f eq '..' || $f eq 'examples');
		$f = "$dir/$f";
		my $ff = "$in/$f";
		$ff =~ s!/+!/!g;
		if (-d $ff) {
print "dir => $f\n";
			if ($ff ne './cmd' && $ff ne './render') {
				next;
			}
			go($f);
			next;
		}
		if ($f !~ /\.js$/ || $f eq '/myweb.min.js') {
			next;
		}
print "file => $f\n";
		my $cnt = `npx uglifyjs --mangle -- $ff`;
		chomp($cnt);
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
			push(@p, sprintf('self.__import__.get("%s")', $url));
			push(@d, undef);
			push(@n, []);
		}
		while ($cnt =~ s/import\s*(.+?)\s*from\s*([`'"])(.+?)\2(;|\r*\n|$)//) {
			my ($name, $url, @names) = ($1, normalize_url($3, $top));
			if ($name =~ s/\{(.*?)\}//) {	
				@names = split(/\s*,\s*/, $1);
			}
			$name =~ s/(^\s+|\s+$)//g;
			push(@p, sprintf('self.__import__.get("%s")', $url));
			push(@d, $name);
			push(@n, \@names);
		}
		if (@p) {
			my $dcnt = 'let m;';
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
			$cnt = sprintf('let %s;import.meta.__imports__=Promise.all([%s]).then(arr=>{%s});%s', join(',', @lets), join(',', @p), $dcnt, $cnt);
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
		if ($f eq '/myweb.js') {
			$index = $cnt;
			next;
		}
		$import{$f} = 'data:text/javascript;text,'.$cnt;
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
